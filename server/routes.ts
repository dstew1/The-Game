import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from 'express-rate-limit';
import { setupAuth } from "./auth";
import { db } from "@db";
import { dailyChallenges, users, chatMessages, mentorPersonalities, milestones, userMilestones, calculateLevel, wins, items, userItems, marketListings, businessMetrics } from "@db/schema";
import { eq, desc, and, gt, gte, not, or } from "drizzle-orm";
import { getMentorResponse } from "./services/ai-mentor";
import { getDailyChallenges } from "./services/dailyChallenges";
import { logger } from "./services/logger";
import * as fs from 'fs';
import * as path from 'path';
import { sql } from "drizzle-orm/sql";
import { generateDailyMilestones } from "./services/milestoneGenerator";
import { personalizationEngine } from "./services/personalizationEngine";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fsPromises from "fs/promises";
import express from "express";

export function registerRoutes(app: Express): Server {
  // Enable trust proxy
  app.set('trust proxy', 1);

  // Configure rate limiters
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const aiChatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 AI requests per hour
    message: "AI chat rate limit exceeded. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);

  // Apply stricter rate limiting to AI chat endpoint
  app.use('/api/chat/send', aiChatLimiter);

  // Serve static files first
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Ensure upload directories exist
  fsPromises.mkdir("./uploads/avatars", { recursive: true }).catch(console.error);

  // Set up multer for avatar uploads
  const storage = multer.diskStorage({
    destination: "./uploads/avatars",
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed"));
        return;
      }
      cb(null, true);
    },
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error("Unhandled error", err, {
      path: req.path,
      userId: req.user?.id,
      requestId: req.id
    });

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
      error: {
        message,
        status,
        path: req.path,
        timestamp: new Date().toISOString()
      }
    });
  });

  setupAuth(app);

  app.post("/api/user/onboarding", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      logger.info("Submitting onboarding data", {
        userId: req.user.id,
        path: "/api/user/onboarding"
      });

      const {
        businessName,
        businessIndustry,
        businessStage,
        entrepreneurExperience,
        primaryGoals,
        skillLevels,
      } = req.body;

      // Update user with onboarding data
      const [updatedUser] = await db
        .update(users)
        .set({
          businessName,
          businessIndustry,
          businessStage,
          entrepreneurExperience,
          primaryGoals,
          skillLevels,
          hasCompletedOnboarding: true,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      logger.info("Onboarding completed successfully", {
        userId: req.user.id,
        businessIndustry,
        businessStage
      });

      res.json(updatedUser);
    } catch (error) {
      logger.error("Error completing onboarding", error, {
        userId: req.user?.id,
        path: "/api/user/onboarding"
      });
      next(error);
    }
  });

  app.get("/api/roadmap", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      logger.info("Starting roadmap data fetch", {
        userId: req.user.id,
        hasCompletedOnboarding: req.user.hasCompletedOnboarding,
        businessIndustry: req.user.businessIndustry
      });

      // Get business metrics
      const businessMetricsData = await db.query.businessMetrics.findFirst({
        where: eq(businessMetrics.userId, req.user.id)
      });

      // Check if we need to generate new daily milestones
      const now = new Date();
      const lastGeneration = req.user.lastMilestoneGeneration ? new Date(req.user.lastMilestoneGeneration) : null;
      logger.info("Checking milestone generation dates", {
        userId: req.user.id,
        currentDate: now.toISOString(),
        lastGeneration: lastGeneration?.toISOString(),
        needsNewMilestones: !lastGeneration || (
          lastGeneration.getDate() !== now.getDate() ||
          lastGeneration.getMonth() !== now.getMonth() ||
          lastGeneration.getFullYear() !== now.getFullYear()
        )
      });

      const needsNewMilestones = !lastGeneration || (
        lastGeneration.getDate() !== now.getDate() ||
        lastGeneration.getMonth() !== now.getMonth() ||
        lastGeneration.getFullYear() !== now.getFullYear()
      );

      if (needsNewMilestones) {
        logger.info("Generating new daily milestones", {
          userId: req.user.id,
          lastGeneration: lastGeneration?.toISOString()
        });
        // Get completed milestone IDs for this user
        const completedMilestones = await db.query.userMilestones.findMany({
          where: and(
            eq(userMilestones.userId, req.user.id),
            eq(userMilestones.completed, true)
          )
        });

        const completedMilestoneIds = completedMilestones.map(um => um.milestoneId);

        logger.info("Found completed milestones", {
          userId: req.user.id,
          completedMilestoneCount: completedMilestoneIds.length,
          completedIds: completedMilestoneIds
        });

        // First, delete user_milestones entries for this user's incomplete milestones
        // and orphaned AI-generated milestones
        await db.delete(userMilestones)
          .where(
            and(
              eq(userMilestones.userId, req.user.id),
              sql`milestone_id IN (
                SELECT m.id FROM milestones m
                WHERE m.ai_generated = true
                AND NOT EXISTS (
                  SELECT 1 FROM user_milestones um2
                  WHERE um2.milestone_id = m.id
                  AND um2.user_id != ${req.user.id}
                  AND um2.completed = true
                )
              )`
            )
          );

        logger.info("Deleted old user milestones", {
          userId: req.user.id,
          completedMilestoneCount: completedMilestoneIds.length
        });

        // Now safe to delete AI-generated milestones that are no longer referenced
        await db.delete(milestones)
          .where(
            and(
              eq(milestones.aiGenerated, true),
              sql`id IN (
                SELECT m.id FROM milestones m
                WHERE NOT EXISTS (
                  SELECT 1 FROM user_milestones um
                  WHERE um.milestone_id = m.id
                )
              )`
            )
          );

        logger.info("Deleted old AI-generated milestones", {
          userId: req.user.id
        });

        // Get personalization context with business metrics
        const personalization = await personalizationEngine.getPersonalization(
          req.user,
          completedMilestones.length,
          0,
          businessMetricsData
        );

        logger.info("Generated personalization context", {
          userId: req.user.id,
          difficulty: personalization.difficulty,
          focusAreas: personalization.focusAreas
        });

        // Generate new daily milestones
        const newMilestones = await generateDailyMilestones(req.user, personalization);

        logger.info("Generated new milestones", {
          userId: req.user.id,
          count: newMilestones.length,
          personalizationDifficulty: personalization.difficulty
        });

        // Insert new milestones and create user_milestone entries
        for (const milestone of newMilestones) {
          const [insertedMilestone] = await db.insert(milestones)
            .values(milestone)
            .returning();

          await db.insert(userMilestones)
            .values({
              userId: req.user.id,
              milestoneId: insertedMilestone.id,
              completed: false,
              completedAt: null,
              reflection: null,
              data: null,
              completedToday: false,
              lastCompletedDate: null
            });
        }

        // Update user's last generation timestamp
        await db.update(users)
          .set({ lastMilestoneGeneration: now })
          .where(eq(users.id, req.user.id));

        logger.info("Successfully created new milestones", {
          userId: req.user.id,
          timestamp: now.toISOString()
        });
      }

      // Get current milestones for this user only
      const currentMilestones = await db.query.milestones.findMany({
        where: sql`id IN (
          SELECT milestone_id FROM user_milestones
          WHERE user_id = ${req.user.id}
        )`,
        orderBy: milestones.order,
      });

      // Get user milestone completions
      const userMilestonesData = await db.query.userMilestones.findMany({
        where: eq(userMilestones.userId, req.user.id),
      });

      // Find the first uncompleted milestone's ID
      const firstUncompletedMilestone = currentMilestones.find(milestone =>
        !userMilestonesData.some(um =>
          um.milestoneId === milestone.id && um.completed
        )
      );

      // Get today's completion count
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = await db.query.userMilestones.findMany({
        where: and(
          eq(userMilestones.userId, req.user.id),
          eq(userMilestones.completed, true),
          gte(userMilestones.completedAt, today)
        ),
      });

      // Check for boss battle completion today
      const completedBossBattleToday = await Promise.all(
        completedToday.map(async (um) => {
          const milestone = await db.query.milestones.findFirst({
            where: eq(milestones.id, um.milestoneId),
          });
          return milestone?.type === "boss_battle";
        })
      ).then(results => results.some(Boolean));

      logger.info("Roadmap data fetched successfully", {
        userId: req.user.id,
        milestonesCount: currentMilestones.length,
        userMilestonesCount: userMilestonesData.length,
        completedToday: completedToday.length,
        completedBossBattle: completedBossBattleToday,
        currentMilestoneId: firstUncompletedMilestone?.id
      });

      res.json({
        milestones: currentMilestones,
        userMilestones: userMilestonesData,
        currentMilestoneId: firstUncompletedMilestone?.id ?? null,
        dailyProgress: {
          completedToday: completedToday.length,
          canComplete: completedToday.length < 5,
          completedBossBattleToday,
        },
      });

    } catch (error) {
      logger.error("Error fetching roadmap data", error, {
        userId: req.user?.id,
        path: "/api/roadmap"
      });
      next(error);
    }
  });

  app.post("/api/roadmap/milestones/:id/complete", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const milestoneId = parseInt(req.params.id);
      if (isNaN(milestoneId)) {
        return res.status(400).send("Invalid milestone ID");
      }

      const { reflection, data } = req.body;

      logger.info("Attempting to complete milestone", {
        userId: req.user.id,
        milestoneId,
        path: `/api/roadmap/milestones/${milestoneId}/complete`
      });


      // Get the milestone
      const milestone = await db.query.milestones.findFirst({
        where: eq(milestones.id, milestoneId),
      });

      if (!milestone) {
        logger.warn("Milestone not found", {
          userId: req.user.id,
          milestoneId
        });
        return res.status(404).send("Milestone not found");
      }

      // Check if user has already completed this milestone
      const existingCompletion = await db.query.userMilestones.findFirst({
        where: and(
          eq(userMilestones.userId, req.user.id),
          eq(userMilestones.milestoneId, milestoneId),
          eq(userMilestones.completed, true)
        ),
      });

      if (existingCompletion) {
        logger.warn("Milestone already completed", {
          userId: req.user.id,
          milestoneId
        });
        return res.status(400).send("Milestone already completed");
      }

      // Check daily completion limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = await db.query.userMilestones.findMany({
        where: and(
          eq(userMilestones.userId, req.user.id),
          eq(userMilestones.completed, true),
          gte(userMilestones.completedAt, today)
        ),
      });

      if (completedToday.length >= 5) {
        logger.warn("Daily milestone limit reached", {
          userId: req.user.id,
          completedCount: completedToday.length
        });
        return res.status(400).send("Daily milestone limit reached");
      }

      // If it's a boss battle, check if user has completed one today
      if (milestone.type === "boss_battle") {
        const completedBossBattleToday = await Promise.all(
          completedToday.map(async (um) => {
            const m = await db.query.milestones.findFirst({
              where: eq(milestones.id, um.milestoneId),
            });
            return m?.type === "boss_battle";
          })
        ).then(results => results.some(Boolean));

        if (completedBossBattleToday) {
          logger.warn("Boss battle already completed today", {
            userId: req.user.id
          });
          return res.status(400).send("Boss battle already completed today");
        }
      }

      // Complete the milestone
      const [completedMilestone] = await db
        .insert(userMilestones)
        .values({
          userId: req.user.id,
          milestoneId,
          completed: true,
          completedAt: new Date(),
          reflection,
          data,
          completedToday: true,
          lastCompletedDate: new Date(),
        })
        .returning();

      // If it's a boss battle, generate random rewards
      let rewards = null;
      if (milestone.type === "boss_battle") {
        const rarities = ["common", "rare", "epic", "legendary"] as const;
        const rarityProbabilities = [0.6, 0.25, 0.1, 0.05]; // 60%, 25%, 10%, 5%
        const randomRarity = () => {
          const roll = Math.random();
          let cumulative = 0;
          for (let i = 0; i < rarityProbabilities.length; i++) {
            cumulative += rarityProbabilities[i];
            if (roll <= cumulative) {
              return rarities[i];
            }
          }
          return rarities[0];
        };

        // Select a random rarity based on probabilities
        const rarity = randomRarity();

        // Get all items of the selected rarity from the milestone generator
        const { MILESTONE_ITEMS } = await import('./services/milestoneGenerator');
        const eligibleItems = MILESTONE_ITEMS.filter(item => item.rarity === rarity);
        const item = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];

        // First insert the item into the items table if it doesn't exist
        const [existingItem] = await db
          .select()
          .from(items)
          .where(
            and(
              eq(items.name, item.name),
              eq(items.rarity, item.rarity),
              eq(items.category, item.category)
            )
          );

        let itemId;
        if (!existingItem) {
          const [newItem] = await db
            .insert(items)
            .values({
              name: item.name,
              description: item.description,
              rarity: item.rarity,
              category: item.category,
              metadata: {},
            })
            .returning();
          itemId = newItem.id;
        } else {
          itemId = existingItem.id;
        }

        // Create user_items entry
        await db.insert(userItems).values({
          userId: req.user.id,
          itemId: itemId,
          acquiredAt: new Date(),
          source: "boss_battle",
          equipped: false,
          metadata: {},
        });

        rewards = {
          ...item,
          acquired: new Date().toISOString()
        };

        // Store the rewards in the user_milestones data
        await db
          .update(userMilestones)
          .set({
            data: {
              ...data,
              rewards
            }
          })
          .where(
            and(
              eq(userMilestones.userId, req.user.id),
              eq(userMilestones.milestoneId, milestoneId)
            )
          );
      }

      // Update user's progress with new level calculation
      const newXp = req.user.xp + milestone.xpReward;
      const [updatedUser] = await db
        .update(users)
        .set({
          xp: newXp,
          level: calculateLevel(newXp),
          dreamcoins: req.user.dreamcoins + milestone.coinReward,
          currentMilestoneId: milestoneId + 1,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      logger.info("Milestone completed successfully", {
        userId: req.user.id,
        milestoneId,
        xpGained: milestone.xpReward,
        coinsGained: milestone.coinReward,
        rewards: rewards ? JSON.stringify(rewards) : undefined
      });

      res.json({
        milestone: completedMilestone,
        user: updatedUser,
        rewards // Include rewards in the response
      });
    } catch (error) {
      logger.error("Error completing milestone", error, {
        userId: req.user?.id,
        milestoneId: req.params.id,
        path: `/api/roadmap/milestones/${req.params.id}/complete`
      });
      next(error);
    }
  });

  app.post("/api/user/mentor-personality", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { personality } = req.body;
    if (!personality || !(personality in mentorPersonalities)) {
      return res.status(400).send("Invalid personality type");
    }

    const [updatedUser] = await db
      .update(users)
      .set({ mentorPersonality: personality })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json(updatedUser);
  });

  app.get("/api/daily-challenges", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const challenges = await getDailyChallenges(req.user);
      res.json(challenges);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/daily-challenges/:id/complete", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).send("Invalid challenge ID");
    }

    const { answer } = req.body; // For quiz challenges

    // Get the challenge
    const [challenge] = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.id, challengeId),
          eq(dailyChallenges.userId, req.user.id)
        )
      )
      .limit(1);

    if (!challenge) {
      return res.status(404).send("Challenge not found");
    }

    if (challenge.completed) {
      return res.status(400).send("Challenge already completed");
    }

    // For quiz challenges, verify the answer
    if (challenge.type === "quiz" && challenge.correctAnswer !== answer) {
      return res.status(400).send("Incorrect answer");
    }

    // Update challenge and user
    const [updatedChallenge] = await db
      .update(dailyChallenges)
      .set({ completed: true })
      .where(eq(dailyChallenges.id, challengeId))
      .returning();

    const newXp = req.user.xp + challenge.xpReward;
    const [updatedUser] = await db
      .update(users)
      .set({
        xp: newXp,
        level: calculateLevel(newXp),
        dreamcoins: req.user.dreamcoins + challenge.coinReward,
      })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json({
      challenge: updatedChallenge,
      user: updatedUser,
    });
  });

  app.post("/api/daily-login", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const lastLogin = req.user.lastLoginDate;
    const now = new Date();

    // For new users or different day logins
    const isNewDay = !lastLogin || (
      lastLogin.getDate() !== now.getDate() ||
      lastLogin.getMonth() !== now.getMonth() ||
      lastLogin.getFullYear() !== now.getFullYear()
    );

    if (isNewDay) {
      const [updatedUser] = await db
        .update(users)
        .set({
          dreamcoins: (req.user.dreamcoins || 0) + 1000,
          loginStreak: (req.user.loginStreak || 0) + 1,
          lastLoginDate: now,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json(updatedUser);
    } else {
      res.json(req.user);
    }
  });

  app.get("/api/daily-rewards", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const lastClaim = req.user.lastDreamCoinClaim;
    const now = new Date();

    // For new users or if never claimed, allow claiming
    const canClaim = !lastClaim || (
      now.getTime() - lastClaim.getTime() >= 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    );

    // Calculate next reward time
    let nextRewardTime = null;
    if (!canClaim && lastClaim) {
      // Set next reward time to 24 hours after last claim
      nextRewardTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    }

    // Calculate streak bonus (5% extra XP per day, up to 50%)
    const streakBonus = Math.min((req.user.loginStreak || 0) * 5, 50);

    res.json({
      loginStreak: req.user.loginStreak || 0,
      streakBonus,
      canClaim,
      nextRewardTime: nextRewardTime?.toISOString(),
    });
  });

  app.post("/api/daily-rewards/claim", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const now = new Date();
    const lastClaim = req.user.lastDreamCoinClaim;
    const lastLogin = req.user.lastLoginDate;

    // Check if 24 hours have passed since last claim
    if (lastClaim && (now.getTime() - lastClaim.getTime() < 24 * 60 * 60 * 1000)) {
      return res.status(400).send("Must wait 24 hours between claims");
    }

    // Check if login streak should be maintained or reset
    let newLoginStreak = req.user.loginStreak || 0;
    if (lastLogin) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // If last login was within the last 24 hours, increase streak
      if (lastLogin.getTime() > yesterday.getTime()) {
        newLoginStreak += 1;
      } else {
        // If last login was more than 24 hours ago, reset streak
        newLoginStreak = 1;
      }
    } else {
      // First login ever
      newLoginStreak = 1;
    }

    // Calculate streak bonus (5% extra XP per day, up to 50%)
    const streakBonus = Math.min(newLoginStreak * 5, 50);
    const xpReward = Math.floor(100 * (1 + streakBonus / 100));

    const newXp = req.user.xp + xpReward;
    const [updatedUser] = await db
      .update(users)
      .set({
        dreamcoins: req.user.dreamcoins + 1000,
        xp: newXp,
        level: calculateLevel(newXp),
        lastDreamCoinClaim: now,
        loginStreak: newLoginStreak,
        lastLoginDate: now,
      })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json({
      dreamcoins: 1000,
      xp: xpReward,
      user: updatedUser,
      nextRewardTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  app.get("/api/chat/history", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.userId, req.user.id),
      orderBy: desc(chatMessages.createdAt),
      limit: 50,
    });

    res.json(messages.reverse());
  });

  app.post("/api/chat/send", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).send("Message is required");
    }

    // Save user message
    const [userMessage] = await db
      .insert(chatMessages)
      .values({
        userId: req.user.id,
        content: message,
        role: "user",
      })
      .returning();

    // Get previous messages for context
    const previousMessages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.userId, req.user.id),
      orderBy: chatMessages.createdAt,
      limit: 10,
    });

    // Get AI response with enriched context
    const aiResponse = await getMentorResponse(
      message,
      {
        userId: req.user.id,
        userLevel: req.user.level || 1,
        userXp: req.user.xp || 0,
        mentorPersonality: req.user.mentorPersonality || "balanced",
        // Add onboarding data
        businessIndustry: req.user.businessIndustry,
        businessStage: req.user.businessStage,
        entrepreneurExperience: req.user.entrepreneurExperience,
        primaryGoals: req.user.primaryGoals as string[],
        skillLevels: req.user.skillLevels as Record<string, number>,
      },
      previousMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))
    );

    // Save AI response
    const [assistantMessage] = await db
      .insert(chatMessages)
      .values({
        userId: req.user.id,
        content: aiResponse,
        role: "assistant",
      })
      .returning();

    res.json({
      userMessage,
      assistantMessage,
    });
  });

  app.post("/api/theme", (req, res) => {
    const { theme } = req.body;

    // Write to theme.json
    fs.writeFileSync(
      path.resolve(process.cwd(), "theme.json"),
      JSON.stringify(theme, null, 2)
    );

    res.json({ success: true });
  });

  // Get business metrics
  app.get("/api/business-metrics", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const metrics = await db.query.businessMetrics.findFirst({
        where: eq(businessMetrics.userId, req.user.id)
      });

      res.json(metrics || {});
    } catch (error) {
      logger.error("Error fetching business metrics", error);
      res.status(500).send("Error fetching business metrics");
    }
  });

  // Update business metrics
  app.post("/api/business-metrics", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const {
        businessName,
        monthlyRevenue,
        customerCount,
        socialFollowers,
        employeeCount,
        websiteVisitors
      } = req.body;

      // Check if metrics already exist for this user
      const existingMetrics = await db.query.businessMetrics.findFirst({
        where: eq(businessMetrics.userId, req.user.id)
      });

      if (existingMetrics) {
        // Update existing metrics
        const [updated] = await db
          .update(businessMetrics)
          .set({
            businessName,
            monthlyRevenue,
            customerCount,
            socialFollowers,
            employeeCount,
            websiteVisitors,
            updatedAt: new Date()
          })
          .where(eq(businessMetrics.userId, req.user.id))
          .returning();

        res.json(updated);
      } else {
        // Create new metrics
        const [created] = await db
          .insert(businessMetrics)
          .values({
            userId: req.user.id,
            businessName,
            monthlyRevenue,
            customerCount,
            socialFollowers,
            employeeCount,
            websiteVisitors
          })
          .returning();

        res.json(created);
      }
    } catch (error) {
      logger.error("Error updating business metrics", error);
      res.status(500).send("Error updating business metrics");
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      if (!req.body.username || !req.body.password) {
        return res.status(400).send("Username and password arerequired");
      }

      logger.info("Starting user registration", {
        username: req.body.username,
        path: "/api/register"
      });

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, req.body.username),
      });

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Create new user with currentMilestoneId set to 1
      const [newUser] = await db
        .insert(users)
        .values({
          username: req.body.username,
          password: req.body.password, // Note: This should be hashed in production
          email: req.body.email || null,
          xp: 0,
          level: 1,
          dreamcoins: 1000, // Starting coins
          loginStreak: 0,
          lastLoginDate: null,
          lastDreamCoinClaim: null,
          mentorPersonality: "balanced",
          hasCompletedOnboarding: false,
          // Initialize business-related fields as null
          businessName: null,
          businessIndustry: null,
          businessStage: null,
          entrepreneurExperience: null,
          primaryGoals: [],
          skillLevels: {},
          currentMilestoneId: 1,
          avatarUrl: null,
          lastMilestoneGeneration: null
        })
        .returning();

      if (!newUser || !newUser.id) {
        throw new Error("Failed to create user");
      }

      try {
        // Initialize chat history with welcome message
        await db.insert(chatMessages).values({
          userId: newUser.id,
          content: "Welcome to The Game! I'm your AI mentor. I'll help guide you through your entrepreneurial journey. What would you like to know?",
          role: "assistant",
          createdAt: new Date()
        });

        // Initialize daily challenges
        const initialChallenges = await getDailyChallenges({
          id: newUser.id,
          username: newUser.username,
          xp: 0,
          level: 1,
          dreamcoins: 1000,
          businessIndustry: null,
          businessStage: null,
          entrepreneurExperience: null,
          primaryGoals: [],
          skillLevels: {}
        });

        if (initialChallenges && initialChallenges.length > 0) {
          await db.insert(dailyChallenges).values(
            initialChallenges.map(challenge => ({
              ...challenge,
              userId: newUser.id,
              completed: false
            }))
          );
        }

        // Initialize first milestone as available
        await db.insert(userMilestones).values({
          userId: newUser.id,
          milestoneId: 1,
          completed: false,
          completedToday: false,
          lastCompletedDate: null,
          reflection: null,
          data: null
        });
      } catch (initError) {
        logger.error("Error initializing user data", initError, {
          userId: newUser.id,
          username: newUser.username
        });
        // Continue with login even if some initializations fail
        // The missing data can be initialized later when accessed
      }

      logger.info("User registration completed successfully", {
        userId: newUser.id,
        username: newUser.username
      });

      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(newUser);
      });

    } catch (error) {
      logger.error("Error during user registration", error, {
        path: "/api/register"
      });
      next(error);
    }
  });

  app.get("/api/leaderboard/xp", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const topUsers = await db.query.users.findMany({
        orderBy: [desc(users.xp)],
        limit: 10,
        columns: {
          id: true,
          username: true,
          level: true,
          xp: true,
          dreamcoins: true,
        },
      });

      res.json(topUsers);
    } catch (error) {
      logger.error("Error fetching XP leaderboard", error);
      res.status(500).send("Error fetching leaderboard");
    }
  });

  app.get("/api/leaderboard/dreamcoins", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const topUsers = await db.query.users.findMany({
        orderBy: [desc(users.dreamcoins)],
        limit: 10,
        columns: {
          id: true,
          username: true,
          level: true,
          xp: true,
          dreamcoins: true,
        },
      });

      res.json(topUsers);
    } catch (error) {
      logger.error("Error fetching DreamCoins leaderboard", error);
      res.status(500).send("Error fetching leaderboard");
    }
  });

  app.post("/api/wins", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).send("Content is required");
      }

      const [win] = await db
        .insert(wins)
        .values({
          userId: req.user.id,
          title: "Achievement Posted",
          description: content,
          type: "user_post",
          xpReward: 50, // Give some XP for sharing
          coinReward: 100, // Give some coins for sharing
          metadata: {},
        })
        .returning();

      // Get username for response
      const [user] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      // Update user's XP and coins
      await db
        .update(users)
        .set({
          xp: req.user.xp + win.xpReward,
          dreamcoins: req.user.dreamcoins + win.coinReward,
        })
        .where(eq(users.id, req.user.id));

      res.json({
        ...win,
        username: user.username,
      });
    } catch (error) {
      logger.error("Error posting win", error, {
        userId: req.user?.id,
        path: "/api/wins"
      });
      next(error);
    }
  });

  app.get("/api/wins", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const wins = await db.execute(
        sql`SELECT w.*, u.username 
            FROM wins w 
            JOIN users u ON w.user_id = u.id 
            ORDER BY w.created_at DESC 
            LIMIT 20`
      );

      const formattedWins = wins.rows.map(win => ({
        id: win.id,
        userId: win.user_id,
        username: win.username,
        description: win.description,
        createdAt: new Date(win.created_at).toISOString(),
      }));

      res.json(formattedWins);
    } catch (error) {
      logger.error("Error fetching wins", error);
      res.status(500).send("Error fetching wins");
    }
  });

  app.get("/api/inventory", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      logger.info("Fetching inventory", {
        userId: req.user.id,
        username: req.user.username,
        path: "/api/inventory"
      });


      const items = await db.query.userItems.findMany({
        where: eq(userItems.userId, req.user.id),
        with: {
          item: true
        }
      });

      logger.info("Inventory fetched successfully", {
        userId: req.user.id,
        username: req.user.username,
        itemCount: items.length
      });

      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  // List an item on the market
  app.post("/api/market/list", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const { itemId, price } = req.body;

      if (!itemId || !price || price <= 0) {
        return res.status(400).send("Invalid item ID or price");
      }

      // Check if the user owns the item
      const [userItem] = await db
        .select()
        .from(userItems)
        .where(
          and(
            eq(userItems.userId, req.user.id),
            eq(userItems.itemId, itemId)
          )
        )
        .limit(1);

      if (!userItem) {
        return res.status(404).send("Item not found in your inventory");
      }

      // Create market listing and remove from user's inventory
      await db.transaction(async (tx) => {
        // Create market listing
        await tx.insert(marketListings).values({
          userId: req.user.id,
          itemId,
          price,
          active: true
        });

        // Remove from user's inventory
        await tx.delete(userItems).where(eq(userItems.id, userItem.id));
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Buy an item from the market
  app.post("/api/market/buy/:listingId", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).send("Invalid listing ID");
      }

      // Get the listing
      const [listing] = await db
        .select()
        .from(marketListings)
        .where(
          and(
            eq(marketListings.id, listingId),
            eq(marketListings.active, true)
          )
        )
        .limit(1);

      if (!listing) {
        return res.status(404).send("Listing not found");
      }

      // Check if user has enough dreamcoins
      if (req.user.dreamcoins < listing.price) {
        return res.status(400).send("Not enough dreamcoins");
      }

      // Process the purchase
      await db.transaction(async (tx) => {
        // Deduct dreamcoins from buyer
        await tx
          .update(users)
          .set({ dreamcoins: req.user.dreamcoins - listing.price })
          .where(eq(users.id, req.user.id));

        // Add dreamcoins to seller
        await tx
          .update(users)
          .set({ dreamcoins: sql`dreamcoins + ${listing.price}` })
          .where(eq(users.id, listing.userId));

        // Mark listing as inactive
        await tx
          .update(marketListings)
          .set({ active: false })
          .where(eq(marketListings.id, listingId));

        // Add item to buyer's inventory
        await tx.insert(userItems).values({
          userId: req.user.id,
          itemId: listing.itemId,
          source: "market_purchase",
          equipped: false,
        });
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Unlist an item from the market
  app.post("/api/market/unlist/:listingId", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).send("Invalid listing ID");
      }

      // Get the listing
      const [listing] = await db
        .select()
        .from(marketListings)
        .where(
          and(
            eq(marketListings.id, listingId),
            eq(marketListings.userId, req.user.id),
            eq(marketListings.active, true)
          )
        )
        .limit(1);

      if (!listing) {
        return res.status(404).send("Listing not found");
      }

      // Return item to user's inventory and mark listing as inactive
      await db.transaction(async (tx) => {
        // Mark listing as inactive
        await tx
          .update(marketListings)
          .set({ active: false })
          .where(eq(marketListings.id, listingId));

        // Return item to user's inventory
        await tx.insert(userItems).values({
          userId: req.user.id,
          itemId: listing.itemId,
          source: "market_unlisted",
          equipped: false,
        });
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Get all market listings
  app.get("/api/market/listings", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const listings = await db.query.marketListings.findMany({
        where: eq(marketListings.active, true),
        with: {
          item: true
        }
      });

      res.json(listings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inventory/equip", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }

      const { userItemId } = req.body;
      if (!userItemId) {
        return res.status(400).send("Item ID is required");
      }

      // Verify the item belongs to the user
      const [userItem] = await db
        .select()
        .from(userItems)
        .where(
          and(
            eq(userItems.id, userItemId),
            eq(userItems.userId, req.user.id)
          )
        )
        .limit(1);

      if (!userItem) {
        return res.status(404).send("Item not found in your inventory");
      }

      // Get the item details to check category
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, userItem.itemId))
        .limit(1);

      // Unequip any other items in the same category
      await db
        .update(userItems)
        .set({ equipped: false })
        .where(
          and(
            eq(userItems.userId, req.user.id),
            not(eq(userItems.id, userItemId))
          )
        );

      // Equip the selected item
      const [updatedUserItem] = await db
        .update(userItems)
        .set({ equipped: !userItem.equipped })
        .where(eq(userItems.id, userItemId))
        .returning();

      res.json(updatedUserItem);
    } catch (error) {
      logger.error("Error equipping item", error, {
        userId: req.user?.id,
        path: "/api/inventory/equip"
      });
      next(error);
    }
  });

  // Initialize items table with predefined items if empty
  app.post("/api/admin/initialize-items", async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).send("Unauthorized");
      }

      const { MILESTONE_ITEMS } = await import('./services/milestoneGenerator');

      // Check if items table is empty
      const existingItems = await db.select().from(items).limit(1);

      if (existingItems.length === 0) {
        // Insert all predefined items
        const insertedItems = await db.insert(items)
          .values(MILESTONE_ITEMS.map(item => ({
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            category: item.category,
            metadata: {}
          })))
          .returning();

        res.json({ message: "Items initialized", count: insertedItems.length });
      } else {
        res.json({ message: "Items table already populated" });
      }
    } catch (error) {
      logger.error("Error initializing items", error);
      next(error);
    }
  });

  // Avatar upload endpoint
  app.post("/api/user/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    try {
      // Get the relative path for storage in database
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user's avatar URL in database
      const [updatedUser] = await db
        .update(users)
        .set({ avatarUrl })
        .where(eq(users.id, req.user.id))
        .returning();

      // Log the update for debugging
      logger.info("Avatar updated successfully", {
        userId: req.user.id,
        avatarUrl
      });

      res.json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
      logger.error("Error updating avatar", error);
      res.status(500).send("Error updating avatar");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}