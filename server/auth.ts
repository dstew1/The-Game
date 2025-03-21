import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    // Use interface merging instead of extends to avoid recursion
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      xp: number;
      level: number;
      dreamcoins: number;
      loginStreak: number;
      lastLoginDate: Date | null;
      lastDreamCoinClaim: Date | null;
      mentorPersonality: string | null;
      businessName: string | null;
      businessIndustry: string | null;
      businessStage: string | null;
      entrepreneurExperience: string | null;
      primaryGoals: string[] | null;
      skillLevels: Record<string, number> | null;
      hasCompletedOnboarding: boolean;
    }
  }
}

// Helper function to check if two dates are consecutive days
function isConsecutiveDay(date1: Date, date2: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return diffMs <= oneDayMs && 
         date1.getDate() !== date2.getDate(); // Different calendar days
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "entrepreneurial-game",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        // Update login streak and last login date
        const now = new Date();
        let newStreak = 1; // Default to 1 for first login or broken streak

        if (user.lastLoginDate) {
          // Check if the last login was consecutive
          if (isConsecutiveDay(user.lastLoginDate, now)) {
            newStreak = (user.loginStreak || 0) + 1;
          }
        }

        // Update user with new streak and login date
        const [updatedUser] = await db
          .update(users)
          .set({
            loginStreak: newStreak,
            lastLoginDate: now,
          })
          .where(eq(users.id, user.id))
          .returning();

        return done(null, updatedUser);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, email, password } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user with initialized game values
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          xp: 0, // Starting XP
          level: 1, // Starting level
          dreamcoins: 0, // Starting coins
          loginStreak: 1, // First login
          lastLoginDate: new Date(),
          lastDreamCoinClaim: null, // Allow immediate claiming of daily reward
          mentorPersonality: "balanced", // Default mentor personality
          hasCompletedOnboarding: false,
          businessName: null,
          businessIndustry: null,
          businessStage: null,
          entrepreneurExperience: null,
          primaryGoals: null,
          skillLevels: null,
        })
        .returning();

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(newUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }

    res.status(401).send("Not logged in");
  });
}