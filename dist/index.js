var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  BASE_XP: () => BASE_XP,
  LEVEL_MULTIPLIER: () => LEVEL_MULTIPLIER,
  MAX_LEVEL: () => MAX_LEVEL,
  businessIndustries: () => businessIndustries,
  businessMetrics: () => businessMetrics,
  businessMetricsRelations: () => businessMetricsRelations,
  businessStages: () => businessStages,
  calculateLevel: () => calculateLevel,
  challengeRelations: () => challengeRelations,
  chatMessageRelations: () => chatMessageRelations,
  chatMessages: () => chatMessages,
  dailyChallenges: () => dailyChallenges,
  entrepreneurExperienceLevels: () => entrepreneurExperienceLevels,
  getLevelProgress: () => getLevelProgress,
  getRequiredXpForLevel: () => getRequiredXpForLevel,
  getTotalXpForLevel: () => getTotalXpForLevel,
  insertUserSchema: () => insertUserSchema,
  itemRelations: () => itemRelations,
  items: () => items,
  marketListingRelations: () => marketListingRelations,
  marketListings: () => marketListings,
  mentorPersonalities: () => mentorPersonalities,
  milestoneRelations: () => milestoneRelations,
  milestones: () => milestones,
  selectUserSchema: () => selectUserSchema,
  skillCategories: () => skillCategories,
  userItemRelations: () => userItemRelations,
  userItems: () => userItems,
  userMilestoneRelations: () => userMilestoneRelations,
  userMilestones: () => userMilestones,
  userRelations: () => userRelations,
  users: () => users,
  winRelations: () => winRelations,
  wins: () => wins
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
function getRequiredXpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1));
}
function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getRequiredXpForLevel(i);
  }
  return total;
}
function calculateLevel(totalXp) {
  let level = 1;
  while (level < MAX_LEVEL && getTotalXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}
function getLevelProgress(totalXp) {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelTotalXp = getTotalXpForLevel(currentLevel);
  const nextLevelTotalXp = getTotalXpForLevel(currentLevel + 1);
  return {
    currentLevel,
    currentLevelXp: totalXp - currentLevelTotalXp,
    nextLevelXp: nextLevelTotalXp - currentLevelTotalXp,
    progress: (totalXp - currentLevelTotalXp) / (nextLevelTotalXp - currentLevelTotalXp) * 100
  };
}
var MAX_LEVEL, BASE_XP, LEVEL_MULTIPLIER, users, insertUserSchema, selectUserSchema, businessIndustries, businessStages, entrepreneurExperienceLevels, skillCategories, dailyChallenges, chatMessages, milestones, userMilestones, wins, items, userItems, marketListings, userRelations, winRelations, challengeRelations, chatMessageRelations, userMilestoneRelations, milestoneRelations, itemRelations, userItemRelations, marketListingRelations, mentorPersonalities, businessMetrics, businessMetricsRelations;
var init_schema = __esm({
  "db/schema.ts"() {
    "use strict";
    MAX_LEVEL = 99;
    BASE_XP = 1e3;
    LEVEL_MULTIPLIER = 1.2;
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").unique().notNull(),
      email: text("email").unique().notNull(),
      password: text("password").notNull(),
      level: integer("level").default(1).notNull(),
      xp: integer("xp").default(0).notNull(),
      dreamcoins: integer("dreamcoins").default(1e3).notNull(),
      lastLoginDate: timestamp("last_login_date").defaultNow(),
      loginStreak: integer("login_streak").default(0).notNull(),
      lastDreamCoinClaim: timestamp("last_dreamcoin_claim"),
      avatarUrl: text("avatar_url").default("/default-avatar.svg"),
      mentorPersonality: text("mentor_personality").default("balanced").notNull(),
      lastMilestoneGeneration: timestamp("last_milestone_generation"),
      currentMilestoneId: integer("current_milestone_id"),
      businessName: text("business_name"),
      businessIndustry: text("business_industry"),
      businessStage: text("business_stage"),
      entrepreneurExperience: text("entrepreneur_experience"),
      primaryGoals: jsonb("primary_goals"),
      skillLevels: jsonb("skill_levels"),
      hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
      challengeHistory: jsonb("challenge_history").default("[]")
      // Add challenge history to user table
    });
    insertUserSchema = createInsertSchema(users, {
      email: z.string().email("Invalid email format"),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      businessName: z.string().optional(),
      businessIndustry: z.string().optional(),
      businessStage: z.string().optional(),
      entrepreneurExperience: z.string().optional(),
      primaryGoals: z.array(z.string()).optional(),
      skillLevels: z.record(z.number()).optional()
    });
    selectUserSchema = createSelectSchema(users);
    businessIndustries = {
      technology: "Technology & Software",
      saas: "Mobile Apps & SaaS",
      ecommerce: "E-commerce & Retail",
      content: "Social Media & Content Creation",
      digital_products: "Digital Products & Online Courses",
      gaming: "E-sports & Gaming",
      eco: "Sustainable & Eco-friendly",
      agency: "Digital Marketing & Agency",
      web3: "Blockchain & Web3",
      ai: "AI & ML Solutions",
      food: "Food & Beverage",
      health: "Health & Wellness",
      education: "Education & Training",
      creative: "Creative & Media",
      other: "Other"
    };
    businessStages = {
      idea: "Just an Idea",
      planning: "Planning & Research",
      startup: "Early Startup",
      established: "Established Business"
    };
    entrepreneurExperienceLevels = {
      none: "No Prior Experience",
      some: "Some Experience",
      experienced: "Experienced Entrepreneur"
    };
    skillCategories = {
      marketing: "Marketing & Sales",
      finance: "Finance & Accounting",
      operations: "Operations & Management",
      technology: "Technology & Development",
      communication: "Communication & Networking",
      innovation: "Innovation & Problem Solving"
    };
    dailyChallenges = pgTable("daily_challenges", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      description: text("description").notNull(),
      completed: boolean("completed").default(false),
      xpReward: integer("xp_reward").notNull(),
      coinReward: integer("coin_reward").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      type: text("type").notNull(),
      // 'task' or 'quiz'
      aiGenerated: boolean("ai_generated").default(false),
      options: jsonb("options"),
      // For quiz questions
      correctAnswer: text("correct_answer")
      // For quiz questions
    });
    chatMessages = pgTable("chat_messages", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      role: text("role").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    milestones = pgTable("milestones", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      order: integer("order").notNull(),
      type: text("type").notNull(),
      // "task" or "boss_battle"
      xpReward: integer("xp_reward").notNull(),
      coinReward: integer("coin_reward").notNull(),
      requirements: jsonb("requirements").notNull(),
      // Store specific requirements for completion
      aiGenerated: boolean("ai_generated").default(false),
      category: text("category").notNull(),
      // e.g., "market_research", "branding", "finance"
      difficulty: integer("difficulty").default(1),
      estimatedDuration: text("estimated_duration").notNull(),
      // e.g., "30min", "1h", "2h"
      generatedDate: timestamp("generated_date").defaultNow(),
      // When this milestone was generated
      previousGenerations: jsonb("previous_generations").default("[]")
      // Track similar milestones for uniqueness
    });
    userMilestones = pgTable("user_milestones", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      milestoneId: integer("milestone_id").notNull().references(() => milestones.id),
      completed: boolean("completed").default(false),
      completedAt: timestamp("completed_at"),
      reflection: text("reflection"),
      // User's reflection on the milestone
      data: jsonb("data"),
      // Store user's input data for the milestone
      completedToday: boolean("completed_today").default(false),
      lastCompletedDate: timestamp("last_completed_date"),
      completionMetrics: jsonb("completion_metrics").default("{}"),
      // Store metrics like time taken, attempts, etc.
      skillProgress: jsonb("skill_progress").default("{}"),
      // Track skill improvements
      learningStyle: jsonb("learning_style").default("{}")
      // Capture learning preferences
    });
    wins = pgTable("wins", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      title: text("title").notNull(),
      description: text("description").notNull(),
      type: text("type").notNull(),
      // achievement, milestone, daily_challenge, etc.
      xpReward: integer("xp_reward").default(0),
      coinReward: integer("coin_reward").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      metadata: jsonb("metadata").default("{}")
    });
    items = pgTable("items", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      rarity: text("rarity").notNull(),
      // common, rare, epic, legendary
      category: text("category").notNull(),
      // office_artifacts, tech_relics, startup_memorabilia, etc.
      metadata: jsonb("metadata").default("{}"),
      createdAt: timestamp("created_at").defaultNow()
    });
    userItems = pgTable("user_items", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      itemId: integer("item_id").notNull().references(() => items.id),
      acquiredAt: timestamp("acquired_at").defaultNow(),
      source: text("source").notNull(),
      // e.g., "boss_battle", "achievement", "purchase"
      equipped: boolean("equipped").default(false),
      metadata: jsonb("metadata").default("{}")
    });
    marketListings = pgTable("market_listings", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      itemId: integer("item_id").notNull().references(() => items.id),
      price: integer("price").notNull(),
      listedAt: timestamp("listed_at").defaultNow(),
      active: boolean("active").default(true),
      metadata: jsonb("metadata").default("{}")
    });
    userRelations = relations(users, ({ many, one }) => ({
      challenges: many(dailyChallenges),
      messages: many(chatMessages),
      userMilestones: many(userMilestones),
      wins: many(wins),
      currentMilestone: one(milestones, {
        fields: [users.currentMilestoneId],
        references: [milestones.id]
      }),
      inventory: many(userItems),
      marketListings: many(marketListings),
      businessMetrics: one(businessMetrics, {
        fields: [users.id],
        references: [businessMetrics.userId]
      })
    }));
    winRelations = relations(wins, ({ one }) => ({
      user: one(users, {
        fields: [wins.userId],
        references: [users.id]
      })
    }));
    challengeRelations = relations(dailyChallenges, ({ one }) => ({
      user: one(users, {
        fields: [dailyChallenges.userId],
        references: [users.id]
      })
    }));
    chatMessageRelations = relations(chatMessages, ({ one }) => ({
      user: one(users, {
        fields: [chatMessages.userId],
        references: [users.id]
      })
    }));
    userMilestoneRelations = relations(userMilestones, ({ one }) => ({
      user: one(users, {
        fields: [userMilestones.userId],
        references: [users.id]
      }),
      milestone: one(milestones, {
        fields: [userMilestones.milestoneId],
        references: [milestones.id]
      })
    }));
    milestoneRelations = relations(milestones, ({ many }) => ({
      userMilestones: many(userMilestones)
    }));
    itemRelations = relations(items, ({ many }) => ({
      owners: many(userItems)
    }));
    userItemRelations = relations(userItems, ({ one }) => ({
      user: one(users, {
        fields: [userItems.userId],
        references: [users.id]
      }),
      item: one(items, {
        fields: [userItems.itemId],
        references: [items.id]
      })
    }));
    marketListingRelations = relations(marketListings, ({ one }) => ({
      user: one(users, {
        fields: [marketListings.userId],
        references: [users.id]
      }),
      item: one(items, {
        fields: [marketListings.itemId],
        references: [items.id]
      })
    }));
    mentorPersonalities = {
      balanced: {
        name: "Balanced",
        description: "A well-rounded mentor balancing encouragement with practical advice"
      },
      motivational: {
        name: "Motivational",
        description: "Highly encouraging and enthusiastic, focusing on motivation and celebration"
      },
      analytical: {
        name: "Analytical",
        description: "Data-driven approach with detailed analysis and strategic planning"
      },
      challenger: {
        name: "Challenger",
        description: "Pushes you out of your comfort zone with challenging tasks and goals"
      }
    };
    businessMetrics = pgTable("business_metrics", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      businessName: text("business_name"),
      industry: text("industry"),
      monthlyRevenue: integer("monthly_revenue"),
      customerCount: integer("customer_count"),
      socialFollowers: integer("social_followers"),
      employeeCount: integer("employee_count"),
      websiteVisitors: integer("website_visitors"),
      shortTermGoals: text("short_term_goals"),
      challenges: text("challenges"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    businessMetricsRelations = relations(businessMetrics, ({ one }) => ({
      user: one(users, {
        fields: [businessMetrics.userId],
        references: [users.id]
      })
    }));
  }
});

// db/index.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var db;
var init_db = __esm({
  "db/index.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    db = drizzle({
      connection: process.env.DATABASE_URL,
      schema: schema_exports,
      ws
    });
  }
});

// server/services/ai-mentor.ts
import OpenAI from "openai";
import { eq as eq2 } from "drizzle-orm";
async function getMentorResponse(userMessage, context, previousMessages = []) {
  try {
    const metrics = await db.query.businessMetrics.findFirst({
      where: eq2(businessMetrics.userId, context.userId)
    });
    let personalityPrompt = MENTOR_PERSONALITIES[context.mentorPersonality] + "\n\n";
    const baseWithContext = BASE_PERSONALITY.replace("{businessIndustry}", context.businessIndustry || "unspecified").replace("{businessStage}", context.businessStage || "unspecified").replace("{entrepreneurExperience}", context.entrepreneurExperience || "unspecified").replace("{goals}", context.primaryGoals?.join(", ") || "unspecified").replace("{skills}", Object.entries(context.skillLevels || {}).map(([skill, level]) => `${skill}: ${level}/5`).join(", ") || "unspecified").replace("{businessName}", metrics?.businessName || "unspecified").replace("{monthlyRevenue}", metrics?.monthlyRevenue?.toString() || "0").replace("{customerCount}", metrics?.customerCount?.toString() || "0").replace("{socialFollowers}", metrics?.socialFollowers?.toString() || "0").replace("{employeeCount}", metrics?.employeeCount?.toString() || "0").replace("{websiteVisitors}", metrics?.websiteVisitors?.toString() || "0");
    personalityPrompt += baseWithContext;
    const messages = [
      { role: "system", content: personalityPrompt },
      ...previousMessages,
      {
        role: "system",
        content: `Current user stats: Level ${context.userLevel}, XP: ${context.userXp}`
      },
      { role: "user", content: userMessage }
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content || "I'm processing your request...";
  } catch (error) {
    console.error("Error getting mentor response:", error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
  }
}
var openai, MENTOR_PERSONALITIES, BASE_PERSONALITY;
var init_ai_mentor = __esm({
  "server/services/ai-mentor.ts"() {
    "use strict";
    init_db();
    init_schema();
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key"
    });
    MENTOR_PERSONALITIES = {
      balanced: `You are a well-rounded entrepreneurial mentor, balancing encouragement with practical advice.
Keep your responses clear and simple:
- Use natural, conversational language
- Give practical, actionable advice
- Focus on one point at a time
- Avoid using markdown formatting or special characters`,
      motivational: `You are a high-energy, enthusiastic entrepreneurial mentor focused on motivation and celebration.
Keep your responses clear and simple:
- Use energetic, positive language
- Celebrate achievements naturally
- Keep formatting minimal and clean
- Focus on building confidence through clear communication`,
      analytical: `You are a data-driven entrepreneurial mentor focused on strategic planning and analysis.
Keep your responses clear and simple:
- Present information clearly without special formatting
- Use clear, logical structure
- Present data in a readable format
- Keep technical explanations accessible`,
      challenger: `You are a results-driven entrepreneurial mentor who pushes users to excel.
Keep your responses clear and simple:
- Present challenges directly
- Give clear, actionable feedback
- Maintain a direct communication style
- Keep formatting minimal and clean`
    };
    BASE_PERSONALITY = `As a mentor in "The Game", a gamified entrepreneurship platform:
Remember to:
1. Keep responses clear and natural, avoid using markdown symbols or special formatting
2. Structure advice in simple paragraphs
3. Use clear language that's easy to read
4. Present information in a conversational way
5. Maintain a consistent, clean format without special characters or symbols
6. Tailor advice based on the user's profile:
   - Business: ${"{businessIndustry}"} industry, ${"{businessStage}"} stage
   - Experience: ${"{entrepreneurExperience}"}
   - Goals: ${"{goals}"}
   - Skills: ${"{skills}"}
   - Business Metrics:
     * Business Name: ${"{businessName}"}
     * Monthly Revenue: ${"{monthlyRevenue}"}
     * Customer Count: ${"{customerCount}"}
     * Social Followers: ${"{socialFollowers}"}
     * Employee Count: ${"{employeeCount}"}
     * Website Visitors: ${"{websiteVisitors}"}`;
  }
});

// server/services/logger.ts
var Logger, logger;
var init_logger = __esm({
  "server/services/logger.ts"() {
    "use strict";
    Logger = class _Logger {
      static instance;
      constructor() {
      }
      static getInstance() {
        if (!_Logger.instance) {
          _Logger.instance = new _Logger();
        }
        return _Logger.instance;
      }
      formatLog(entry) {
        const base = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`;
        const context = [
          entry.requestId ? `requestId=${entry.requestId}` : null,
          entry.userId ? `userId=${entry.userId}` : null,
          entry.path ? `path=${entry.path}` : null
        ].filter(Boolean).join(" ");
        let result = base + (context ? ` (${context})` : "");
        if (entry.error) {
          result += `
Error: ${entry.error.name}: ${entry.error.message}`;
          if (entry.error.stack) {
            result += `
Stack trace:
${entry.error.stack}`;
          }
        }
        if (entry.metadata) {
          result += `
Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
        }
        return result;
      }
      createLogEntry(level, message, error, metadata) {
        return {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message,
          ...error && {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          },
          ...metadata && { metadata }
        };
      }
      info(message, metadata) {
        const entry = this.createLogEntry("info", message, void 0, metadata);
        console.log(this.formatLog(entry));
      }
      warn(message, metadata) {
        const entry = this.createLogEntry("warn", message, void 0, metadata);
        console.warn(this.formatLog(entry));
      }
      error(message, error, metadata) {
        const entry = this.createLogEntry("error", message, error, metadata);
        console.error(this.formatLog(entry));
      }
    };
    logger = Logger.getInstance();
  }
});

// server/services/milestoneGenerator.ts
var milestoneGenerator_exports = {};
__export(milestoneGenerator_exports, {
  MILESTONE_ITEMS: () => MILESTONE_ITEMS,
  generateDailyMilestones: () => generateDailyMilestones
});
async function generateDailyMilestones(user, personalization) {
  const milestones2 = [];
  const DAILY_MILESTONE_COUNT = 5;
  const baseTaskXP = 100 * personalization.difficulty;
  const baseTaskCoins = 50 * personalization.difficulty;
  const baseBossXP = 500 * personalization.difficulty;
  const baseBossCoins = 250 * personalization.difficulty;
  for (let i = 0; i < DAILY_MILESTONE_COUNT; i++) {
    const isBossBattle = i === DAILY_MILESTONE_COUNT - 1;
    const content = await generateMilestoneContent(i + 1, user, isBossBattle, personalization);
    const milestone = {
      title: content.title,
      description: content.description,
      type: isBossBattle ? "boss_battle" : "task",
      category: content.category,
      difficulty: personalization.difficulty,
      estimatedDuration: isBossBattle ? "2h" : `${30 + i * 15}min`,
      xpReward: Math.round((isBossBattle ? baseBossXP : baseTaskXP) * (1 + i * 0.2)),
      coinReward: Math.round((isBossBattle ? baseBossCoins : baseTaskCoins) * (1 + i * 0.2)),
      order: i + 1,
      requirements: {
        fields: content.fields,
        ...isBossBattle && {
          rewards: {
            items: [selectRandomItem()]
            // Boss battles reward one random item
          }
        }
      },
      aiGenerated: true
    };
    milestones2.push(milestone);
  }
  return milestones2;
}
function selectRandomItem() {
  const rarityProbabilities = [
    { rarity: "common", chance: 0.6 },
    // 60% chance
    { rarity: "rare", chance: 0.25 },
    // 25% chance
    { rarity: "epic", chance: 0.1 },
    // 10% chance
    { rarity: "legendary", chance: 0.05 }
    // 5% chance
  ];
  const roll = Math.random();
  let cumulative = 0;
  const selectedRarity = rarityProbabilities.find((r) => {
    cumulative += r.chance;
    return roll <= cumulative;
  }).rarity;
  const itemsOfRarity = MILESTONE_ITEMS.filter((item) => item.rarity === selectedRarity);
  return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
}
async function generateMilestoneContent(phase, user, isBossBattle, personalization) {
  const prompt = `Generate a unique ${personalization.difficulty}/5 difficulty business milestone ${isBossBattle ? "boss battle" : "task"} for phase ${phase} of 5.

Context:
- Industry: ${personalization.industryContext.keyTerminology.length > 0 ? "Focusing on " + personalization.industryContext.keyTerminology.join(", ") : user.businessIndustry || "General"}
- Business Stage: ${user.businessStage || "Ideation"}
- Experience Level: ${user.entrepreneurExperience || "Beginner"}
- Primary Goals: ${user.primaryGoals?.join(", ") || "Not specified"}
- Focus Areas: ${personalization.focusAreas.join(", ")}
- Industry-Specific Goals: ${personalization.industryContext.industrySpecificGoals.join(", ")}
- Key Metrics to Track: ${personalization.industryContext.relevantMetrics.join(", ")}

Ensure this milestone is different from any previous ones by focusing on:
1. Different aspects of ${personalization.focusAreas[phase % personalization.focusAreas.length]}
2. Progressive complexity (${phase}/5 progression)
3. Building upon skills from previous phases
4. Incorporating industry-specific metrics and terminology

Format the response as JSON:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "fields": ["string"]
}`;
  const response = await getMentorResponse(prompt, {
    userId: user.id,
    userLevel: user.level || 1,
    userXp: user.xp || 0,
    mentorPersonality: "analytical",
    businessIndustry: personalization.industryContext.keyTerminology.length > 0 ? personalization.industryContext.keyTerminology[0] : user.businessIndustry || void 0,
    businessStage: user.businessStage || void 0,
    entrepreneurExperience: user.entrepreneurExperience || void 0,
    primaryGoals: user.primaryGoals,
    skillLevels: user.skillLevels
  });
  try {
    const content = JSON.parse(response);
    return {
      title: isBossBattle ? `Boss Battle: ${content.title}` : content.title,
      description: isBossBattle ? `${content.description}

Complete this boss battle to earn XP, coins, and a mystical business item!` : content.description,
      category: content.category,
      fields: content.fields
    };
  } catch (error) {
    logger.error("Error parsing milestone content", {
      error: error instanceof Error ? error.message : String(error),
      userId: user.id,
      phase,
      isBossBattle
    });
    return {
      title: isBossBattle ? "Boss Battle: Industry Challenge" : "Business Development Task",
      description: `Complete key ${isBossBattle ? "objectives" : "tasks"} for your ${user.businessIndustry || "business"} venture${isBossBattle ? " and earn XP, coins, and a mystical business item!" : ""}`,
      category: "development",
      fields: ["planningDocument", "implementation", "results"]
    };
  }
}
var MILESTONE_ITEMS;
var init_milestoneGenerator = __esm({
  "server/services/milestoneGenerator.ts"() {
    "use strict";
    init_ai_mentor();
    init_logger();
    MILESTONE_ITEMS = [
      // Legendary Items (The rarest and most prestigious)
      {
        type: "item",
        name: "Steve Jobs' Lost Turtleneck",
        description: "The mythical black turtleneck that inspired a generation of 'one more thing' presentations. Smells faintly of innovation.",
        rarity: "legendary",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "First Bitcoin Pizza Receipt",
        description: "A crumpled receipt for two pizzas bought for 10,000 BTC. The most expensive pizza order in history!",
        rarity: "legendary",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "Original Garage Door",
        description: "The actual garage door where a certain tech company started. Still has chalk markings of the first business plan.",
        rarity: "legendary",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The First Viral Tweet Framed in Gold",
        description: "A golden frame containing the first tweet that ever went viral. Shows signs of being retweeted too many times.",
        rarity: "legendary",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "Ancient Scroll of Terms & Conditions",
        description: "The legendary scroll that nobody has ever read completely. Contains secrets of the digital realm.",
        rarity: "legendary",
        category: "corporate_treasures"
      },
      // Epic Items (Very rare and special)
      {
        type: "item",
        name: "Y Combinator's Golden Hoodie",
        description: "A mysterious hoodie that makes you look like you know what 'product-market fit' means.",
        rarity: "epic",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The Unbreakable NDAs",
        description: "A stack of NDAs so powerful they can keep even the office gossip quiet. Made from reinforced legal jargon.",
        rarity: "epic",
        category: "corporate_treasures"
      },
      {
        type: "item",
        name: "Web 1.0 Server Brick",
        description: "An actual brick from the first web server. Still warm from processing <marquee> tags.",
        rarity: "epic",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Eternal Coffee Mug",
        description: "Legend says it once contained the first cup of coffee ever brewed in Silicon Valley.",
        rarity: "epic",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "Blockchain of Fools",
        description: "A physical chain made of tiny blocks, each containing a questionable cryptocurrency whitepaper.",
        rarity: "epic",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Holy Whiteboard",
        description: "Ancient whiteboard containing the first MVP sketch. Still has uncleaned marker stains of billion-dollar ideas.",
        rarity: "epic",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "Zuckerberg's First Hoodie",
        description: "The original gray hoodie that started the tech casual revolution. Slightly worn, heavily influential.",
        rarity: "epic",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The Pitch Deck Prophecies",
        description: "An ancient deck that perfectly predicted the rise and fall of countless startups. Slightly singed from friction burns.",
        rarity: "epic",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Unicorn Horn",
        description: "A crystallized horn from a rare billion-dollar startup. Glows whenever a new funding round is announced.",
        rarity: "epic",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The First Stack Overflow Answer",
        description: "Preserved in digital amber, this answer solved a problem no one remembers having.",
        rarity: "epic",
        category: "tech_relics"
      },
      // Rare Items (Uncommon and valuable)
      {
        type: "item",
        name: "Prototype Post-It Notes",
        description: "The original yellow sticky notes used to plan world domination, one task at a time.",
        rarity: "rare",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Broken Ping Pong Table",
        description: "A battle-scarred table that witnessed countless startup pivots during intense matches.",
        rarity: "rare",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "Stand-Up Meeting Stool",
        description: "The ironic stool used in the world's longest 'quick' stand-up meeting.",
        rarity: "rare",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "Venture Capitalist's Monocle",
        description: "Helps you see through pitch decks and straight to the bottom line.",
        rarity: "rare",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Rubber Duck of Debugging",
        description: "A legendary rubber duck that has heard more coding problems than any therapist.",
        rarity: "rare",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Beta Tester's Notebook",
        description: "Contains detailed notes of bugs that should never have made it to production, but did.",
        rarity: "rare",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Mechanical Keyboard of Focus",
        description: "So loud it drowns out all distractions and office gossip. Cherry MX switches included.",
        rarity: "rare",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Founder's Flip-Flops",
        description: "Well-worn flip-flops that walked the halls of countless tech conferences.",
        rarity: "rare",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The Business Model Canvas",
        description: "A mystical canvas that's witnessed thousands of pivot brainstorming sessions.",
        rarity: "rare",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Angel Investor's Halo",
        description: "Slightly tarnished from one too many seed rounds, but still sparkles in pitch meetings.",
        rarity: "rare",
        category: "corporate_treasures"
      },
      {
        type: "item",
        name: "The Perpetual Beta Badge",
        description: "A badge proudly proclaiming 'Beta Tester Since Forever'. Somehow still hasn't reached v1.0.",
        rarity: "rare",
        category: "tech_relics"
      },
      // Common Items (Still cool, but more accessible)
      {
        type: "item",
        name: "Startup Sticker Collection",
        description: "A pristine collection of stickers from startups that no longer exist.",
        rarity: "common",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The Mythical Man-Month Calendar",
        description: "A calendar that always shows you're behind schedule, no matter how early you start.",
        rarity: "common",
        category: "business_tools"
      },
      {
        type: "item",
        name: "Pizza-Stained Keyboard",
        description: "A keyboard bearing the marks of countless late-night coding sessions.",
        rarity: "common",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Infinite Todo List",
        description: "A scrolling parchment that generates new tasks faster than you can complete them.",
        rarity: "common",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Reply-All Chain Mail",
        description: "An actual chain mail made from the metal of computers destroyed by reply-all storms.",
        rarity: "common",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Casual Friday Hawaiian Shirt",
        description: "Has survived hundreds of casual Fridays and still looks painfully casual.",
        rarity: "common",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The LinkedIn Premium Crown",
        description: "A slightly dented crown that gives you the power to see who viewed your profile.",
        rarity: "common",
        category: "corporate_treasures"
      },
      {
        type: "item",
        name: "The Expired Domain Collection",
        description: "A book of domain names that could have been worth millions... maybe.",
        rarity: "common",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Agile Sprint Shoes",
        description: "Well-worn shoes that have run through countless sprint planning sessions.",
        rarity: "common",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Stack of Business Cards",
        description: "A stack of cards from networking events, most with coffee stains and scribbled notes.",
        rarity: "common",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Motivational Poster Collection",
        description: "A set of posters that have inspired eye rolls across thousands of offices.",
        rarity: "common",
        category: "office_artifacts"
      },
      {
        type: "item",
        name: "The Beta Version Badge",
        description: "A badge that's been in beta longer than most startups have existed.",
        rarity: "common",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Viral Growth Chart",
        description: "A chart showing hockey stick growth that looks suspiciously like a hockey stick.",
        rarity: "common",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Disruption Button",
        description: "A big red button that's been pressed by every 'disruptive' startup founder.",
        rarity: "common",
        category: "startup_memorabilia"
      },
      {
        type: "item",
        name: "The Pivot Table of Destiny",
        description: "An Excel sheet that's pivoted so many times it's achieved consciousness.",
        rarity: "common",
        category: "business_tools"
      },
      {
        type: "item",
        name: "The Blockchain Beanie",
        description: "A beanie that's been mined from the depths of crypto winter.",
        rarity: "rare",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Cloud Storage Snowglobe",
        description: "Shake it to see your data float around in the cloud.",
        rarity: "rare",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The Scalability Scepter",
        description: "A royal scepter that grows longer with each new user added.",
        rarity: "epic",
        category: "tech_relics"
      },
      {
        type: "item",
        name: "The IPO Bell",
        description: "A bell that rings with the sound of instant millionaires being created.",
        rarity: "legendary",
        category: "corporate_treasures"
      },
      {
        type: "item",
        name: "The Startup Graveyard Key",
        description: "A mysterious key that opens the vault of failed startup ideas.",
        rarity: "epic",
        category: "startup_memorabilia"
      }
    ];
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
init_schema();
init_db();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
var scryptAsync = promisify(scrypt);
var crypto = {
  hash: async (password) => {
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword, storedPassword) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = await scryptAsync(
      suppliedPassword,
      salt,
      64
    );
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  }
};
function isConsecutiveDay(date1, date2) {
  const oneDayMs = 24 * 60 * 60 * 1e3;
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return diffMs <= oneDayMs && date1.getDate() !== date2.getDate();
}
function setupAuth(app2) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings = {
    secret: process.env.REPL_ID || "entrepreneurial-game",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 864e5
    })
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true
    };
  }
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        const now = /* @__PURE__ */ new Date();
        let newStreak = 1;
        if (user.lastLoginDate) {
          if (isConsecutiveDay(user.lastLoginDate, now)) {
            newStreak = (user.loginStreak || 0) + 1;
          }
        }
        const [updatedUser] = await db.update(users).set({
          loginStreak: newStreak,
          lastLoginDate: now
        }).where(eq(users.id, user.id)).returning();
        return done(null, updatedUser);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map((i) => i.message).join(", "));
      }
      const { username, email, password } = result.data;
      const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const [existingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }
      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        xp: 0,
        // Starting XP
        level: 1,
        // Starting level
        dreamcoins: 0,
        // Starting coins
        loginStreak: 1,
        // First login
        lastLoginDate: /* @__PURE__ */ new Date(),
        lastDreamCoinClaim: null,
        // Allow immediate claiming of daily reward
        mentorPersonality: "balanced",
        // Default mentor personality
        hasCompletedOnboarding: false,
        businessName: null,
        businessIndustry: null,
        businessStage: null,
        entrepreneurExperience: null,
        primaryGoals: null,
        skillLevels: null
      }).returning();
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
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        return res.json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}

// server/routes.ts
init_db();
init_schema();
init_ai_mentor();
import { eq as eq4, desc, and as and2, gte as gte2, not } from "drizzle-orm";

// server/services/dailyChallenges.ts
init_db();
init_schema();
init_logger();
import { and, eq as eq3, gte } from "drizzle-orm";
var CHALLENGES_PER_DAY = 3;
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
function getChallengeTemplates(user) {
  const businessStage = user.businessStage || "ideation";
  const experience = user.entrepreneurExperience || "beginner";
  const industry = user.businessIndustry || "general";
  const baseTemplates = [
    // General Business Development
    {
      type: "task",
      category: "daily_progress",
      description: "Update your business progress tracker with today's key metrics",
      xpReward: 50,
      coinReward: 100
    },
    {
      type: "task",
      category: "networking",
      description: "Connect with another entrepreneur in your industry on LinkedIn",
      xpReward: 75,
      coinReward: 150
    },
    {
      type: "task",
      category: "learning",
      description: "Read an industry report or case study relevant to your business",
      xpReward: 60,
      coinReward: 120
    },
    {
      type: "task",
      category: "productivity",
      description: "Create a prioritized task list for your next business milestone",
      xpReward: 45,
      coinReward: 90
    },
    // Market Research Quizzes
    {
      type: "quiz",
      category: "market_research",
      description: "What's the first step in validating a business idea?",
      options: [
        "Build a complete product",
        "Talk to potential customers",
        "Create a business plan",
        "Design a logo"
      ],
      correctAnswer: "Talk to potential customers",
      xpReward: 100,
      coinReward: 200
    },
    {
      type: "quiz",
      category: "business_strategy",
      description: "Which of these is NOT a valid way to validate market demand?",
      options: [
        "Creating a landing page to gauge interest",
        "Conducting customer interviews",
        "Building a full product without feedback",
        "Running small-scale tests"
      ],
      correctAnswer: "Building a full product without feedback",
      xpReward: 90,
      coinReward: 180
    },
    {
      type: "quiz",
      category: "finance",
      description: "What's the most important financial metric for an early-stage startup?",
      options: [
        "Revenue Growth",
        "Burn Rate",
        "Profit Margin",
        "Total Assets"
      ],
      correctAnswer: "Burn Rate",
      xpReward: 95,
      coinReward: 190
    },
    // Time Management
    {
      type: "task",
      category: "productivity",
      description: "Implement a time-tracking system for your daily business activities",
      xpReward: 70,
      coinReward: 140
    },
    // Customer Development
    {
      type: "task",
      category: "customer_research",
      description: "Conduct at least 3 customer interviews to gather product feedback",
      xpReward: 120,
      coinReward: 240
    }
  ];
  const industryTemplates = {
    technology: [
      {
        type: "task",
        category: "product_development",
        description: "Create a technical specification document for your main feature",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "quiz",
        category: "tech_trends",
        description: "Which development methodology is best for rapid iteration?",
        options: ["Waterfall", "Agile", "V-Model", "Big Bang"],
        correctAnswer: "Agile",
        xpReward: 100,
        coinReward: 200
      },
      {
        type: "task",
        category: "security",
        description: "Perform a basic security audit of your application",
        xpReward: 150,
        coinReward: 300
      },
      {
        type: "quiz",
        category: "tech_stack",
        description: "What's most important when choosing a tech stack for a startup?",
        options: [
          "Using the newest technologies",
          "Speed of development and maintenance",
          "What competitors use",
          "Personal preference"
        ],
        correctAnswer: "Speed of development and maintenance",
        xpReward: 110,
        coinReward: 220
      },
      {
        type: "task",
        category: "tech_growth",
        description: "Analyze your application's performance metrics and identify optimization opportunities",
        xpReward: 130,
        coinReward: 260
      },
      {
        type: "task",
        category: "tech_security",
        description: "Review and update your application's security measures",
        xpReward: 140,
        coinReward: 280
      }
    ],
    ecommerce: [
      {
        type: "task",
        category: "inventory",
        description: "Analyze your top-selling products and optimize inventory levels",
        xpReward: 90,
        coinReward: 180
      },
      {
        type: "quiz",
        category: "retail_operations",
        description: "What's the most important metric for an e-commerce business?",
        options: ["Total Revenue", "Customer Lifetime Value", "Number of Products", "Website Traffic"],
        correctAnswer: "Customer Lifetime Value",
        xpReward: 110,
        coinReward: 220
      },
      {
        type: "task",
        category: "customer_service",
        description: "Review and respond to all customer feedback from the past week",
        xpReward: 100,
        coinReward: 200
      },
      {
        type: "task",
        category: "marketing",
        description: "Optimize product descriptions for SEO on your top 5 products",
        xpReward: 130,
        coinReward: 260
      },
      {
        type: "task",
        category: "ecommerce_optimization",
        description: "Optimize your product pages for conversion rate",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "task",
        category: "inventory_management",
        description: "Review and optimize your inventory management system",
        xpReward: 110,
        coinReward: 220
      }
    ],
    services: [
      {
        type: "task",
        category: "service_delivery",
        description: "Document your service delivery process and identify improvement areas",
        xpReward: 110,
        coinReward: 220
      },
      {
        type: "quiz",
        category: "service_business",
        description: "What's the most effective way to price services?",
        options: ["Hourly Rate", "Value-Based Pricing", "Cost-Plus Pricing", "Market Rate"],
        correctAnswer: "Value-Based Pricing",
        xpReward: 100,
        coinReward: 200
      },
      {
        type: "task",
        category: "client_management",
        description: "Create a client onboarding checklist for your services",
        xpReward: 120,
        coinReward: 240
      }
    ],
    health: [
      {
        type: "task",
        category: "compliance",
        description: "Review and update your health & safety compliance documentation",
        xpReward: 140,
        coinReward: 280
      },
      {
        type: "quiz",
        category: "healthcare",
        description: "What's the most important factor in healthcare business success?",
        options: ["Location", "Patient Satisfaction", "Equipment Quality", "Marketing"],
        correctAnswer: "Patient Satisfaction",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "task",
        category: "patient_care",
        description: "Develop a patient feedback collection system",
        xpReward: 130,
        coinReward: 260
      }
    ],
    education: [
      {
        type: "task",
        category: "curriculum",
        description: "Create an outline for a new course or training program",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "quiz",
        category: "edtech",
        description: "What's the most effective way to measure learning outcomes?",
        options: ["Test Scores", "Student Engagement", "Completion Rates", "Student Feedback"],
        correctAnswer: "Student Engagement",
        xpReward: 110,
        coinReward: 220
      },
      {
        type: "task",
        category: "student_success",
        description: "Analyze student progress data and identify improvement areas",
        xpReward: 130,
        coinReward: 260
      }
    ],
    food: [
      {
        type: "task",
        category: "food_safety",
        description: "Conduct a comprehensive food safety audit of your operations",
        xpReward: 150,
        coinReward: 300
      },
      {
        type: "quiz",
        category: "food_business",
        description: "What's the most important factor in food business profitability?",
        options: ["Menu Pricing", "Food Cost Control", "Marketing", "Location"],
        correctAnswer: "Food Cost Control",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "task",
        category: "menu_engineering",
        description: "Analyze your menu items' profitability and popularity",
        xpReward: 140,
        coinReward: 280
      }
    ]
  };
  const stageSpecificTemplates = {
    idea: [
      {
        type: "task",
        category: "validation",
        description: "Create a simple landing page to test your business concept",
        xpReward: 100,
        coinReward: 200
      },
      {
        type: "quiz",
        category: "ideation",
        description: "What's the most important factor in idea validation?",
        options: ["Market Size", "Customer Need", "Competition", "Technology"],
        correctAnswer: "Customer Need",
        xpReward: 90,
        coinReward: 180
      }
    ],
    planning: [
      {
        type: "task",
        category: "business_planning",
        description: "Draft your business model canvas",
        xpReward: 130,
        coinReward: 260
      },
      {
        type: "quiz",
        category: "planning",
        description: "What should be the first section of your business plan?",
        options: ["Financials", "Executive Summary", "Market Analysis", "Team"],
        correctAnswer: "Executive Summary",
        xpReward: 100,
        coinReward: 200
      }
    ],
    startup: [
      {
        type: "task",
        category: "growth",
        description: "Set up your customer acquisition tracking system",
        xpReward: 120,
        coinReward: 240
      },
      {
        type: "quiz",
        category: "startup_metrics",
        description: "What's the most important early-stage startup metric?",
        options: ["Revenue", "User Growth", "Profit", "Market Share"],
        correctAnswer: "User Growth",
        xpReward: 110,
        coinReward: 220
      }
    ],
    established: [
      {
        type: "task",
        category: "scaling",
        description: "Create a 90-day scaling plan for your business",
        xpReward: 150,
        coinReward: 300
      },
      {
        type: "quiz",
        category: "business_growth",
        description: "What's the most effective way to scale an established business?",
        options: ["Hiring More Staff", "Process Automation", "Marketing", "New Products"],
        correctAnswer: "Process Automation",
        xpReward: 130,
        coinReward: 260
      }
    ]
  };
  let seed = user.id + (/* @__PURE__ */ new Date()).getDate();
  const random = () => {
    const x = Math.sin(seed++) * 1e4;
    return x - Math.floor(x);
  };
  const allTemplates = [
    ...baseTemplates,
    ...industryTemplates[industry] || [],
    ...stageSpecificTemplates[businessStage] || []
  ];
  const taskTemplates = allTemplates.filter((t) => t.type === "task");
  const quizTemplates = allTemplates.filter((t) => t.type === "quiz");
  const selectedTemplates = [];
  if (quizTemplates.length > 0) {
    selectedTemplates.push(...getRandomItems(quizTemplates, 1));
  }
  const remainingCount = CHALLENGES_PER_DAY - selectedTemplates.length;
  if (remainingCount > 0 && taskTemplates.length > 0) {
    selectedTemplates.push(...getRandomItems(taskTemplates, remainingCount));
  }
  while (selectedTemplates.length < CHALLENGES_PER_DAY) {
    const remaining = allTemplates.filter((t) => !selectedTemplates.includes(t));
    if (remaining.length === 0) break;
    selectedTemplates.push(...getRandomItems(remaining, 1));
  }
  const levelMultiplier = Math.max(1, Math.floor(user.level / 10) * 0.2 + 1);
  const expMultiplier = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2
  }[experience] || 1;
  return selectedTemplates.map((template) => ({
    ...template,
    xpReward: Math.round(template.xpReward * levelMultiplier * expMultiplier * (0.9 + random() * 0.2)),
    coinReward: Math.round(template.coinReward * levelMultiplier * expMultiplier * (0.9 + random() * 0.2))
  }));
}
async function getRandomUniqueChallenge(templates, user, count) {
  try {
    let challengeHistory = [];
    try {
      const rawHistory = user.challengeHistory;
      if (Array.isArray(rawHistory)) {
        challengeHistory = rawHistory;
      } else if (typeof rawHistory === "string") {
        challengeHistory = JSON.parse(rawHistory);
      }
      challengeHistory = challengeHistory.slice(-90);
    } catch (error) {
      logger.warn("Error parsing challenge history, using empty array", {
        userId: user.id,
        error
      });
    }
    const availableTemplates = templates.filter(
      (template) => !challengeHistory.includes(template.description)
    );
    if (availableTemplates.length < count) {
      logger.info("Running out of unique challenges, resetting history", {
        userId: user.id,
        availableCount: availableTemplates.length,
        requestedCount: count
      });
      await db.update(users).set({ challengeHistory: [] }).where(eq3(users.id, user.id));
      return templates.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    const prioritizedTemplates = availableTemplates.sort((a, b) => {
      let aScore = 0;
      let bScore = 0;
      if (user.primaryGoals?.includes(a.category)) aScore += 2;
      if (user.primaryGoals?.includes(b.category)) bScore += 2;
      const skillLevels = user.skillLevels || {};
      if (skillLevels[a.category] < 3) aScore += 1;
      if (skillLevels[b.category] < 3) bScore += 1;
      return bScore - aScore;
    });
    return prioritizedTemplates.slice(0, count);
  } catch (error) {
    logger.error("Error getting unique challenges", error, {
      userId: user.id,
      templatesCount: templates.length
    });
    throw error;
  }
}
async function getDailyChallenges(user) {
  try {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    logger.info("Starting to fetch daily challenges", {
      userId: user.id,
      businessStage: user.businessStage,
      experience: user.entrepreneurExperience
    });
    const existingChallenges = await db.select().from(dailyChallenges).where(
      and(
        eq3(dailyChallenges.userId, user.id),
        gte(dailyChallenges.createdAt, today)
      )
    );
    if (existingChallenges.length > 0) {
      logger.info("Found existing challenges for today", {
        userId: user.id,
        challengeCount: existingChallenges.length
      });
      return existingChallenges;
    }
    const templates = getChallengeTemplates(user);
    const newChallenges = await getRandomUniqueChallenge(templates, user, CHALLENGES_PER_DAY);
    logger.info("Generated new challenge templates", {
      userId: user.id,
      challengeCount: newChallenges.length
    });
    const insertedChallenges = await db.insert(dailyChallenges).values(
      newChallenges.map((challenge) => ({
        userId: user.id,
        description: challenge.description,
        type: challenge.type,
        xpReward: challenge.xpReward,
        coinReward: challenge.coinReward,
        options: challenge.options,
        correctAnswer: challenge.correctAnswer,
        aiGenerated: false,
        createdAt: /* @__PURE__ */ new Date(),
        completed: false
      }))
    ).returning();
    let challengeHistory = [];
    try {
      const rawHistory = user.challengeHistory;
      if (Array.isArray(rawHistory)) {
        challengeHistory = rawHistory;
      } else if (typeof rawHistory === "string") {
        challengeHistory = JSON.parse(rawHistory);
      }
    } catch (error) {
      logger.warn("Error parsing existing challenge history", {
        userId: user.id,
        error
      });
    }
    const updatedHistory = [
      ...challengeHistory,
      ...newChallenges.map((c) => c.description)
    ];
    await db.update(users).set({ challengeHistory: updatedHistory }).where(eq3(users.id, user.id));
    logger.info("Successfully generated and saved new challenges", {
      userId: user.id,
      challengeCount: insertedChallenges.length,
      historyCount: updatedHistory.length
    });
    return insertedChallenges;
  } catch (error) {
    logger.error("Error in getDailyChallenges", error, {
      userId: user.id,
      path: "/api/daily-challenges"
    });
    throw error;
  }
}

// server/routes.ts
init_logger();
init_milestoneGenerator();
import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm/sql";

// server/services/personalizationEngine.ts
var PersonalizationEngine = class {
  getIndustryContext(industry) {
    const defaultContext = {
      industrySpecificGoals: [
        "Define core value proposition",
        "Identify target market",
        "Create business model"
      ],
      keyTerminology: [
        "market validation",
        "customer acquisition",
        "revenue model"
      ],
      relevantMetrics: [
        "customer acquisition cost",
        "lifetime value",
        "conversion rate"
      ]
    };
    if (!industry || industry === "other") {
      return defaultContext;
    }
    const industryContexts = {
      technology: {
        industrySpecificGoals: [
          "Develop MVP",
          "Technical validation",
          "User experience optimization"
        ],
        keyTerminology: [
          "scalability",
          "user experience",
          "technical architecture"
        ],
        relevantMetrics: [
          "user engagement",
          "churn rate",
          "technical performance"
        ]
      },
      ecommerce: {
        industrySpecificGoals: [
          "Product sourcing",
          "Inventory management",
          "Online store optimization"
        ],
        keyTerminology: [
          "conversion rate",
          "cart abandonment",
          "customer retention"
        ],
        relevantMetrics: [
          "average order value",
          "inventory turnover",
          "customer lifetime value"
        ]
      }
      // Add more industry contexts as needed
    };
    return industryContexts[industry] || defaultContext;
  }
  calculateDifficulty(completedMilestones, averageCompletionTime, experienceLevel) {
    let baseDifficulty = 1;
    if (completedMilestones > 20) baseDifficulty++;
    if (completedMilestones > 50) baseDifficulty++;
    if (averageCompletionTime < 24) baseDifficulty++;
    switch (experienceLevel) {
      case "experienced":
        baseDifficulty = Math.min(baseDifficulty + 2, 5);
        break;
      case "some":
        baseDifficulty = Math.min(baseDifficulty + 1, 4);
        break;
      default:
        baseDifficulty = Math.min(baseDifficulty, 3);
    }
    return Math.max(1, Math.min(5, baseDifficulty));
  }
  determineFocusAreas(user, completedMilestones) {
    const focusAreas = [];
    const skillLevels = user.skillLevels || {};
    const weakAreas = Object.entries(skillLevels).filter(([_, level]) => level < 3).map(([area]) => area);
    if (weakAreas.length > 0) {
      focusAreas.push(...weakAreas.slice(0, 2));
    }
    switch (user.businessStage) {
      case "idea":
        focusAreas.push("market_research", "business_model");
        break;
      case "planning":
        focusAreas.push("financial_planning", "go_to_market");
        break;
      case "startup":
        focusAreas.push("growth_strategy", "operations");
        break;
      case "established":
        focusAreas.push("optimization", "scaling");
        break;
    }
    const defaultAreas = [
      "market_research",
      "financial_planning",
      "business_model"
    ];
    const uniqueFocusAreas = [.../* @__PURE__ */ new Set([...focusAreas, ...defaultAreas])];
    return uniqueFocusAreas.slice(0, 4);
  }
  async getPersonalization(user, completedMilestones, averageCompletionTime) {
    const difficulty = this.calculateDifficulty(
      completedMilestones,
      averageCompletionTime,
      user.entrepreneurExperience
    );
    const focusAreas = this.determineFocusAreas(user, completedMilestones);
    const industryContext = this.getIndustryContext(user.businessIndustry);
    const suggestedSkills = focusAreas.map((area) => {
      switch (area) {
        case "market_research":
          return "customer_research";
        case "financial_planning":
          return "financial_analysis";
        case "business_model":
          return "business_strategy";
        case "growth_strategy":
          return "growth_hacking";
        default:
          return "problem_solving";
      }
    });
    return {
      difficulty,
      focusAreas,
      suggestedSkills,
      industryContext,
      learningPreferences: {
        preferredTimeOfDay: "any",
        preferredDuration: "1h",
        learningStyle: "hands-on"
      }
    };
  }
};
var personalizationEngine = new PersonalizationEngine();

// server/routes.ts
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fsPromises from "fs/promises";
import express from "express";
function registerRoutes(app2) {
  app2.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  fsPromises.mkdir("./uploads/avatars", { recursive: true }).catch(console.error);
  const storage = multer.diskStorage({
    destination: "./uploads/avatars",
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024
      // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed"));
        return;
      }
      cb(null, true);
    }
  });
  app2.use((err, req, res, next) => {
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
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  });
  setupAuth(app2);
  app2.post("/api/user/onboarding", async (req, res, next) => {
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
        skillLevels
      } = req.body;
      const [updatedUser] = await db.update(users).set({
        businessName,
        businessIndustry,
        businessStage,
        entrepreneurExperience,
        primaryGoals,
        skillLevels,
        hasCompletedOnboarding: true
      }).where(eq4(users.id, req.user.id)).returning();
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
  app2.get("/api/roadmap", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      logger.info("Starting roadmap data fetch", {
        userId: req.user.id,
        hasCompletedOnboarding: req.user.hasCompletedOnboarding,
        businessIndustry: req.user.businessIndustry
      });
      const businessMetricsData = await db.query.businessMetrics.findFirst({
        where: eq4(businessMetrics.userId, req.user.id)
      });
      const now = /* @__PURE__ */ new Date();
      const lastGeneration = req.user.lastMilestoneGeneration ? new Date(req.user.lastMilestoneGeneration) : null;
      logger.info("Checking milestone generation dates", {
        userId: req.user.id,
        currentDate: now.toISOString(),
        lastGeneration: lastGeneration?.toISOString(),
        needsNewMilestones: !lastGeneration || (lastGeneration.getDate() !== now.getDate() || lastGeneration.getMonth() !== now.getMonth() || lastGeneration.getFullYear() !== now.getFullYear())
      });
      const needsNewMilestones = !lastGeneration || (lastGeneration.getDate() !== now.getDate() || lastGeneration.getMonth() !== now.getMonth() || lastGeneration.getFullYear() !== now.getFullYear());
      if (needsNewMilestones) {
        logger.info("Generating new daily milestones", {
          userId: req.user.id,
          lastGeneration: lastGeneration?.toISOString()
        });
        const completedMilestones = await db.query.userMilestones.findMany({
          where: and2(
            eq4(userMilestones.userId, req.user.id),
            eq4(userMilestones.completed, true)
          )
        });
        const completedMilestoneIds = completedMilestones.map((um) => um.milestoneId);
        logger.info("Found completed milestones", {
          userId: req.user.id,
          completedMilestoneCount: completedMilestoneIds.length,
          completedIds: completedMilestoneIds
        });
        await db.delete(userMilestones).where(
          and2(
            eq4(userMilestones.userId, req.user.id),
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
        await db.delete(milestones).where(
          and2(
            eq4(milestones.aiGenerated, true),
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
        const newMilestones = await generateDailyMilestones(req.user, personalization);
        logger.info("Generated new milestones", {
          userId: req.user.id,
          count: newMilestones.length,
          personalizationDifficulty: personalization.difficulty
        });
        for (const milestone of newMilestones) {
          const [insertedMilestone] = await db.insert(milestones).values(milestone).returning();
          await db.insert(userMilestones).values({
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
        await db.update(users).set({ lastMilestoneGeneration: now }).where(eq4(users.id, req.user.id));
        logger.info("Successfully created new milestones", {
          userId: req.user.id,
          timestamp: now.toISOString()
        });
      }
      const currentMilestones = await db.query.milestones.findMany({
        where: sql`id IN (
          SELECT milestone_id FROM user_milestones
          WHERE user_id = ${req.user.id}
        )`,
        orderBy: milestones.order
      });
      const userMilestonesData = await db.query.userMilestones.findMany({
        where: eq4(userMilestones.userId, req.user.id)
      });
      const firstUncompletedMilestone = currentMilestones.find(
        (milestone) => !userMilestonesData.some(
          (um) => um.milestoneId === milestone.id && um.completed
        )
      );
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = await db.query.userMilestones.findMany({
        where: and2(
          eq4(userMilestones.userId, req.user.id),
          eq4(userMilestones.completed, true),
          gte2(userMilestones.completedAt, today)
        )
      });
      const completedBossBattleToday = await Promise.all(
        completedToday.map(async (um) => {
          const milestone = await db.query.milestones.findFirst({
            where: eq4(milestones.id, um.milestoneId)
          });
          return milestone?.type === "boss_battle";
        })
      ).then((results) => results.some(Boolean));
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
          completedBossBattleToday
        }
      });
    } catch (error) {
      logger.error("Error fetching roadmap data", error, {
        userId: req.user?.id,
        path: "/api/roadmap"
      });
      next(error);
    }
  });
  app2.post("/api/roadmap/milestones/:id/complete", async (req, res, next) => {
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
      const milestone = await db.query.milestones.findFirst({
        where: eq4(milestones.id, milestoneId)
      });
      if (!milestone) {
        logger.warn("Milestone not found", {
          userId: req.user.id,
          milestoneId
        });
        return res.status(404).send("Milestone not found");
      }
      const existingCompletion = await db.query.userMilestones.findFirst({
        where: and2(
          eq4(userMilestones.userId, req.user.id),
          eq4(userMilestones.milestoneId, milestoneId),
          eq4(userMilestones.completed, true)
        )
      });
      if (existingCompletion) {
        logger.warn("Milestone already completed", {
          userId: req.user.id,
          milestoneId
        });
        return res.status(400).send("Milestone already completed");
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = await db.query.userMilestones.findMany({
        where: and2(
          eq4(userMilestones.userId, req.user.id),
          eq4(userMilestones.completed, true),
          gte2(userMilestones.completedAt, today)
        )
      });
      if (completedToday.length >= 5) {
        logger.warn("Daily milestone limit reached", {
          userId: req.user.id,
          completedCount: completedToday.length
        });
        return res.status(400).send("Daily milestone limit reached");
      }
      if (milestone.type === "boss_battle") {
        const completedBossBattleToday = await Promise.all(
          completedToday.map(async (um) => {
            const m = await db.query.milestones.findFirst({
              where: eq4(milestones.id, um.milestoneId)
            });
            return m?.type === "boss_battle";
          })
        ).then((results) => results.some(Boolean));
        if (completedBossBattleToday) {
          logger.warn("Boss battle already completed today", {
            userId: req.user.id
          });
          return res.status(400).send("Boss battle already completed today");
        }
      }
      const [completedMilestone] = await db.insert(userMilestones).values({
        userId: req.user.id,
        milestoneId,
        completed: true,
        completedAt: /* @__PURE__ */ new Date(),
        reflection,
        data,
        completedToday: true,
        lastCompletedDate: /* @__PURE__ */ new Date()
      }).returning();
      let rewards = null;
      if (milestone.type === "boss_battle") {
        const rarities = ["common", "rare", "epic", "legendary"];
        const rarityProbabilities = [0.6, 0.25, 0.1, 0.05];
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
        const rarity = randomRarity();
        const { MILESTONE_ITEMS: MILESTONE_ITEMS2 } = await Promise.resolve().then(() => (init_milestoneGenerator(), milestoneGenerator_exports));
        const eligibleItems = MILESTONE_ITEMS2.filter((item2) => item2.rarity === rarity);
        const item = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
        const [existingItem] = await db.select().from(items).where(
          and2(
            eq4(items.name, item.name),
            eq4(items.rarity, item.rarity),
            eq4(items.category, item.category)
          )
        );
        let itemId;
        if (!existingItem) {
          const [newItem] = await db.insert(items).values({
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            category: item.category,
            metadata: {}
          }).returning();
          itemId = newItem.id;
        } else {
          itemId = existingItem.id;
        }
        await db.insert(userItems).values({
          userId: req.user.id,
          itemId,
          acquiredAt: /* @__PURE__ */ new Date(),
          source: "boss_battle",
          equipped: false,
          metadata: {}
        });
        rewards = {
          ...item,
          acquired: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.update(userMilestones).set({
          data: {
            ...data,
            rewards
          }
        }).where(
          and2(
            eq4(userMilestones.userId, req.user.id),
            eq4(userMilestones.milestoneId, milestoneId)
          )
        );
      }
      const newXp = req.user.xp + milestone.xpReward;
      const [updatedUser] = await db.update(users).set({
        xp: newXp,
        level: calculateLevel(newXp),
        dreamcoins: req.user.dreamcoins + milestone.coinReward,
        currentMilestoneId: milestoneId + 1
      }).where(eq4(users.id, req.user.id)).returning();
      logger.info("Milestone completed successfully", {
        userId: req.user.id,
        milestoneId,
        xpGained: milestone.xpReward,
        coinsGained: milestone.coinReward,
        rewards: rewards ? JSON.stringify(rewards) : void 0
      });
      res.json({
        milestone: completedMilestone,
        user: updatedUser,
        rewards
        // Include rewards in the response
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
  app2.post("/api/user/mentor-personality", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const { personality } = req.body;
    if (!personality || !(personality in mentorPersonalities)) {
      return res.status(400).send("Invalid personality type");
    }
    const [updatedUser] = await db.update(users).set({ mentorPersonality: personality }).where(eq4(users.id, req.user.id)).returning();
    res.json(updatedUser);
  });
  app2.get("/api/daily-challenges", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    try {
      const challenges = await getDailyChallenges(req.user);
      res.json(challenges);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  app2.post("/api/daily-challenges/:id/complete", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).send("Invalid challenge ID");
    }
    const { answer } = req.body;
    const [challenge] = await db.select().from(dailyChallenges).where(
      and2(
        eq4(dailyChallenges.id, challengeId),
        eq4(dailyChallenges.userId, req.user.id)
      )
    ).limit(1);
    if (!challenge) {
      return res.status(404).send("Challenge not found");
    }
    if (challenge.completed) {
      return res.status(400).send("Challenge already completed");
    }
    if (challenge.type === "quiz" && challenge.correctAnswer !== answer) {
      return res.status(400).send("Incorrect answer");
    }
    const [updatedChallenge] = await db.update(dailyChallenges).set({ completed: true }).where(eq4(dailyChallenges.id, challengeId)).returning();
    const newXp = req.user.xp + challenge.xpReward;
    const [updatedUser] = await db.update(users).set({
      xp: newXp,
      level: calculateLevel(newXp),
      dreamcoins: req.user.dreamcoins + challenge.coinReward
    }).where(eq4(users.id, req.user.id)).returning();
    res.json({
      challenge: updatedChallenge,
      user: updatedUser
    });
  });
  app2.post("/api/daily-login", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const lastLogin = req.user.lastLoginDate;
    const now = /* @__PURE__ */ new Date();
    const isNewDay = !lastLogin || (lastLogin.getDate() !== now.getDate() || lastLogin.getMonth() !== now.getMonth() || lastLogin.getFullYear() !== now.getFullYear());
    if (isNewDay) {
      const [updatedUser] = await db.update(users).set({
        dreamcoins: (req.user.dreamcoins || 0) + 1e3,
        loginStreak: (req.user.loginStreak || 0) + 1,
        lastLoginDate: now
      }).where(eq4(users.id, req.user.id)).returning();
      res.json(updatedUser);
    } else {
      res.json(req.user);
    }
  });
  app2.get("/api/daily-rewards", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const lastClaim = req.user.lastDreamCoinClaim;
    const now = /* @__PURE__ */ new Date();
    const canClaim = !lastClaim || (lastClaim.getDate() !== now.getDate() || lastClaim.getMonth() !== now.getMonth() || lastClaim.getFullYear() !== now.getFullYear());
    const streakBonus = Math.min((req.user.loginStreak || 0) * 5, 50);
    res.json({
      loginStreak: req.user.loginStreak || 0,
      streakBonus,
      canClaim
    });
  });
  app2.post("/api/daily-rewards/claim", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const now = /* @__PURE__ */ new Date();
    const lastClaim = req.user.lastDreamCoinClaim;
    if (lastClaim && lastClaim.getDate() === now.getDate() && lastClaim.getMonth() === now.getMonth() && lastClaim.getFullYear() === now.getFullYear()) {
      return res.status(400).send("Already claimed today's reward");
    }
    const streakBonus = Math.min(req.user.loginStreak * 5, 50);
    const xpReward = Math.floor(100 * (1 + streakBonus / 100));
    const newXp = req.user.xp + xpReward;
    const [updatedUser] = await db.update(users).set({
      dreamcoins: req.user.dreamcoins + 1e3,
      xp: newXp,
      level: calculateLevel(newXp),
      lastDreamCoinClaim: now
    }).where(eq4(users.id, req.user.id)).returning();
    res.json({
      dreamcoins: 1e3,
      xp: xpReward,
      user: updatedUser
    });
  });
  app2.get("/api/chat/history", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const messages = await db.query.chatMessages.findMany({
      where: eq4(chatMessages.userId, req.user.id),
      orderBy: desc(chatMessages.createdAt),
      limit: 50
    });
    res.json(messages.reverse());
  });
  app2.post("/api/chat/send", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    const { message } = req.body;
    if (!message) {
      return res.status(400).send("Message is required");
    }
    const [userMessage] = await db.insert(chatMessages).values({
      userId: req.user.id,
      content: message,
      role: "user"
    }).returning();
    const previousMessages = await db.query.chatMessages.findMany({
      where: eq4(chatMessages.userId, req.user.id),
      orderBy: chatMessages.createdAt,
      limit: 10
    });
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
        primaryGoals: req.user.primaryGoals,
        skillLevels: req.user.skillLevels
      },
      previousMessages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }))
    );
    const [assistantMessage] = await db.insert(chatMessages).values({
      userId: req.user.id,
      content: aiResponse,
      role: "assistant"
    }).returning();
    res.json({
      userMessage,
      assistantMessage
    });
  });
  app2.post("/api/theme", (req, res) => {
    const { theme } = req.body;
    fs.writeFileSync(
      path.resolve(process.cwd(), "theme.json"),
      JSON.stringify(theme, null, 2)
    );
    res.json({ success: true });
  });
  app2.get("/api/business-metrics", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    try {
      const metrics = await db.query.businessMetrics.findFirst({
        where: eq4(businessMetrics.userId, req.user.id)
      });
      res.json(metrics || {});
    } catch (error) {
      logger.error("Error fetching business metrics", error);
      res.status(500).send("Error fetching business metrics");
    }
  });
  app2.post("/api/business-metrics", async (req, res) => {
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
      const existingMetrics = await db.query.businessMetrics.findFirst({
        where: eq4(businessMetrics.userId, req.user.id)
      });
      if (existingMetrics) {
        const [updated] = await db.update(businessMetrics).set({
          businessName,
          monthlyRevenue,
          customerCount,
          socialFollowers,
          employeeCount,
          websiteVisitors,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(businessMetrics.userId, req.user.id)).returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(businessMetrics).values({
          userId: req.user.id,
          businessName,
          monthlyRevenue,
          customerCount,
          socialFollowers,
          employeeCount,
          websiteVisitors
        }).returning();
        res.json(created);
      }
    } catch (error) {
      logger.error("Error updating business metrics", error);
      res.status(500).send("Error updating business metrics");
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      if (!req.body.username || !req.body.password) {
        return res.status(400).send("Username and password are required");
      }
      logger.info("Starting user registration", {
        username: req.body.username,
        path: "/api/register"
      });
      const existingUser = await db.query.users.findFirst({
        where: eq4(users.username, req.body.username)
      });
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const [newUser] = await db.insert(users).values({
        username: req.body.username,
        password: req.body.password,
        // Note: This should be hashed in production
        email: req.body.email || null,
        xp: 0,
        level: 1,
        dreamcoins: 1e3,
        // Starting coins
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
      }).returning();
      if (!newUser || !newUser.id) {
        throw new Error("Failed to create user");
      }
      try {
        await db.insert(chatMessages).values({
          userId: newUser.id,
          content: "Welcome to The Game! I'm your AI mentor. I'll help guide you through your entrepreneurial journey. What would you like to know?",
          role: "assistant",
          createdAt: /* @__PURE__ */ new Date()
        });
        const initialChallenges = await getDailyChallenges({
          id: newUser.id,
          username: newUser.username,
          xp: 0,
          level: 1,
          dreamcoins: 1e3,
          businessIndustry: null,
          businessStage: null,
          entrepreneurExperience: null,
          primaryGoals: [],
          skillLevels: {}
        });
        if (initialChallenges && initialChallenges.length > 0) {
          await db.insert(dailyChallenges).values(
            initialChallenges.map((challenge) => ({
              ...challenge,
              userId: newUser.id,
              completed: false
            }))
          );
        }
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
      }
      logger.info("User registration completed successfully", {
        userId: newUser.id,
        username: newUser.username
      });
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
  app2.get("/api/leaderboard/xp", async (req, res) => {
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
          dreamcoins: true
        }
      });
      res.json(topUsers);
    } catch (error) {
      logger.error("Error fetching XP leaderboard", error);
      res.status(500).send("Error fetching leaderboard");
    }
  });
  app2.get("/api/leaderboard/dreamcoins", async (req, res) => {
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
          dreamcoins: true
        }
      });
      res.json(topUsers);
    } catch (error) {
      logger.error("Error fetching DreamCoins leaderboard", error);
      res.status(500).send("Error fetching leaderboard");
    }
  });
  app2.post("/api/wins", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).send("Content is required");
      }
      const [win] = await db.insert(wins).values({
        userId: req.user.id,
        title: "Achievement Posted",
        description: content,
        type: "user_post",
        xpReward: 50,
        // Give some XP for sharing
        coinReward: 100,
        // Give some coins for sharing
        metadata: {}
      }).returning();
      const [user] = await db.select({ username: users.username }).from(users).where(eq4(users.id, req.user.id)).limit(1);
      await db.update(users).set({
        xp: req.user.xp + win.xpReward,
        dreamcoins: req.user.dreamcoins + win.coinReward
      }).where(eq4(users.id, req.user.id));
      res.json({
        ...win,
        username: user.username
      });
    } catch (error) {
      logger.error("Error posting win", error, {
        userId: req.user?.id,
        path: "/api/wins"
      });
      next(error);
    }
  });
  app2.get("/api/wins", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    try {
      const wins2 = await db.execute(
        sql`SELECT w.*, u.username 
              FROM wins w 
              JOIN users u ON w.user_id = u.id 
              ORDER BY w.created_at DESC 
              LIMIT 20`
      );
      const formattedWins = wins2.rows.map((win) => ({
        id: win.id,
        userId: win.user_id,
        username: win.username,
        description: win.description,
        createdAt: new Date(win.created_at).toISOString()
      }));
      res.json(formattedWins);
    } catch (error) {
      logger.error("Error fetching wins", error);
      res.status(500).send("Error fetching wins");
    }
  });
  app2.get("/api/inventory", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      logger.info("Fetching inventory", {
        userId: req.user.id,
        username: req.user.username,
        path: "/api/inventory"
      });
      const items2 = await db.query.userItems.findMany({
        where: eq4(userItems.userId, req.user.id),
        with: {
          item: true
        }
      });
      logger.info("Inventory fetched successfully", {
        userId: req.user.id,
        username: req.user.username,
        itemCount: items2.length
      });
      res.json(items2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/market/list", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const { itemId, price } = req.body;
      if (!itemId || !price || price <= 0) {
        return res.status(400).send("Invalid item ID or price");
      }
      const [userItem] = await db.select().from(userItems).where(
        and2(
          eq4(userItems.userId, req.user.id),
          eq4(userItems.itemId, itemId)
        )
      ).limit(1);
      if (!userItem) {
        return res.status(404).send("Item not found in your inventory");
      }
      await db.transaction(async (tx) => {
        await tx.insert(marketListings).values({
          userId: req.user.id,
          itemId,
          price,
          active: true
        });
        await tx.delete(userItems).where(eq4(userItems.id, userItem.id));
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/market/buy/:listingId", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).send("Invalid listing ID");
      }
      const [listing] = await db.select().from(marketListings).where(
        and2(
          eq4(marketListings.id, listingId),
          eq4(marketListings.active, true)
        )
      ).limit(1);
      if (!listing) {
        return res.status(404).send("Listing not found");
      }
      if (req.user.dreamcoins < listing.price) {
        return res.status(400).send("Not enough dreamcoins");
      }
      await db.transaction(async (tx) => {
        await tx.update(users).set({ dreamcoins: req.user.dreamcoins - listing.price }).where(eq4(users.id, req.user.id));
        await tx.update(users).set({ dreamcoins: sql`dreamcoins + ${listing.price}` }).where(eq4(users.id, listing.userId));
        await tx.update(marketListings).set({ active: false }).where(eq4(marketListings.id, listingId));
        await tx.insert(userItems).values({
          userId: req.user.id,
          itemId: listing.itemId,
          source: "market_purchase",
          equipped: false
        });
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/market/unlist/:listingId", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).send("Invalid listing ID");
      }
      const [listing] = await db.select().from(marketListings).where(
        and2(
          eq4(marketListings.id, listingId),
          eq4(marketListings.userId, req.user.id),
          eq4(marketListings.active, true)
        )
      ).limit(1);
      if (!listing) {
        return res.status(404).send("Listing not found");
      }
      await db.transaction(async (tx) => {
        await tx.update(marketListings).set({ active: false }).where(eq4(marketListings.id, listingId));
        await tx.insert(userItems).values({
          userId: req.user.id,
          itemId: listing.itemId,
          source: "market_unlisted",
          equipped: false
        });
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/market/listings", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const listings = await db.query.marketListings.findMany({
        where: eq4(marketListings.active, true),
        with: {
          item: true
        }
      });
      res.json(listings);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/inventory/equip", async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send("Not authenticated");
      }
      const { userItemId } = req.body;
      if (!userItemId) {
        return res.status(400).send("Item ID is required");
      }
      const [userItem] = await db.select().from(userItems).where(
        and2(
          eq4(userItems.id, userItemId),
          eq4(userItems.userId, req.user.id)
        )
      ).limit(1);
      if (!userItem) {
        return res.status(404).send("Item not found in your inventory");
      }
      const [item] = await db.select().from(items).where(eq4(items.id, userItem.itemId)).limit(1);
      await db.update(userItems).set({ equipped: false }).where(
        and2(
          eq4(userItems.userId, req.user.id),
          not(eq4(userItems.id, userItemId))
        )
      );
      const [updatedUserItem] = await db.update(userItems).set({ equipped: !userItem.equipped }).where(eq4(userItems.id, userItemId)).returning();
      res.json(updatedUserItem);
    } catch (error) {
      logger.error("Error equipping item", error, {
        userId: req.user?.id,
        path: "/api/inventory/equip"
      });
      next(error);
    }
  });
  app2.post("/api/admin/initialize-items", async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).send("Unauthorized");
      }
      const { MILESTONE_ITEMS: MILESTONE_ITEMS2 } = await Promise.resolve().then(() => (init_milestoneGenerator(), milestoneGenerator_exports));
      const existingItems = await db.select().from(items).limit(1);
      if (existingItems.length === 0) {
        const insertedItems = await db.insert(items).values(MILESTONE_ITEMS2.map((item) => ({
          name: item.name,
          description: item.description,
          rarity: item.rarity,
          category: item.category,
          metadata: {}
        }))).returning();
        res.json({ message: "Items initialized", count: insertedItems.length });
      } else {
        res.json({ message: "Items table already populated" });
      }
    } catch (error) {
      logger.error("Error initializing items", error);
      next(error);
    }
  });
  app2.post("/api/user/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const [updatedUser] = await db.update(users).set({ avatarUrl }).where(eq4(users.id, req.user.id)).returning();
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@db": path2.resolve(__dirname, "db"),
      "@": path2.resolve(__dirname, "client", "src")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (msg.includes("[TypeScript] Found 0 errors. Watching for file changes")) {
          log("no errors found", "tsc");
          return;
        }
        if (msg.includes("[TypeScript] ")) {
          const [errors, summary] = msg.split("[TypeScript] ", 2);
          log(`${summary} ${errors}\x1B[0m`, "tsc");
          return;
        } else {
          viteLogger.error(msg, options);
          process.exit(1);
        }
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      const template = await fs2.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
setupAuth(app);
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const server = registerRoutes(app);
    app.use((err, _req, res, _next) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const ports = [5e3, 5001, 5002];
    let lastError;
    for (const port of ports) {
      try {
        await new Promise((resolve2, reject) => {
          server.listen(port, "0.0.0.0").once("listening", () => {
            console.log(`Server started on port ${port}`);
            log(`Server started on port ${port}`);
            resolve2();
          }).once("error", (err) => {
            reject(err);
          });
        });
        return;
      } catch (err) {
        lastError = err;
        if (err.code === "EADDRINUSE") {
          log(`Port ${port} is in use, trying next port...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("All ports in use");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
