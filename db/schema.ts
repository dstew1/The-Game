import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Leveling system constants
export const MAX_LEVEL = 99;
export const BASE_XP = 1000;
export const LEVEL_MULTIPLIER = 1.2; // Reduced from 1.5 for more gradual progression

// Calculate XP required for a specific level
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

// Calculate total XP required up to a level
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getRequiredXpForLevel(i);
  }
  return total;
}

// Calculate level from total XP
export function calculateLevel(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && getTotalXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

// Get XP progress for current level
export function getLevelProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelTotalXp = getTotalXpForLevel(currentLevel);
  const nextLevelTotalXp = getTotalXpForLevel(currentLevel + 1);

  return {
    currentLevel,
    currentLevelXp: totalXp - currentLevelTotalXp,
    nextLevelXp: nextLevelTotalXp - currentLevelTotalXp,
    progress: ((totalXp - currentLevelTotalXp) / (nextLevelTotalXp - currentLevelTotalXp)) * 100
  };
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  dreamcoins: integer("dreamcoins").default(1000).notNull(),
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
  challengeHistory: jsonb("challenge_history").default('[]'), // Add challenge history to user table
});

// Update the insert schema to make onboarding fields optional
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().optional(),
  businessIndustry: z.string().optional(),
  businessStage: z.string().optional(),
  entrepreneurExperience: z.string().optional(),
  primaryGoals: z.array(z.string()).optional(),
  skillLevels: z.record(z.number()).optional(),
});

export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const businessIndustries = {
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
  other: "Other",
} as const;

export const businessStages = {
  idea: "Just an Idea",
  planning: "Planning & Research",
  startup: "Early Startup",
  established: "Established Business",
} as const;

export const entrepreneurExperienceLevels = {
  none: "No Prior Experience",
  some: "Some Experience",
  experienced: "Experienced Entrepreneur",
} as const;

export const skillCategories = {
  marketing: "Marketing & Sales",
  finance: "Finance & Accounting",
  operations: "Operations & Management",
  technology: "Technology & Development",
  communication: "Communication & Networking",
  innovation: "Innovation & Problem Solving",
} as const;

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  completed: boolean("completed").default(false),
  xpReward: integer("xp_reward").notNull(),
  coinReward: integer("coin_reward").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  type: text("type").notNull(), // 'task' or 'quiz'
  aiGenerated: boolean("ai_generated").default(false),
  options: jsonb("options"), // For quiz questions
  correctAnswer: text("correct_answer"), // For quiz questions
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  type: text("type").notNull(), // "task" or "boss_battle"
  xpReward: integer("xp_reward").notNull(),
  coinReward: integer("coin_reward").notNull(),
  requirements: jsonb("requirements").notNull(), // Store specific requirements for completion
  aiGenerated: boolean("ai_generated").default(false),
  category: text("category").notNull(), // e.g., "market_research", "branding", "finance"
  difficulty: integer("difficulty").default(1),
  estimatedDuration: text("estimated_duration").notNull(), // e.g., "30min", "1h", "2h"
  generatedDate: timestamp("generated_date").defaultNow(), // When this milestone was generated
  previousGenerations: jsonb("previous_generations").default('[]'), // Track similar milestones for uniqueness
});

export const userMilestones = pgTable("user_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  reflection: text("reflection"), // User's reflection on the milestone
  data: jsonb("data"), // Store user's input data for the milestone
  completedToday: boolean("completed_today").default(false),
  lastCompletedDate: timestamp("last_completed_date"),
  completionMetrics: jsonb("completion_metrics").default('{}'), // Store metrics like time taken, attempts, etc.
  skillProgress: jsonb("skill_progress").default('{}'), // Track skill improvements
  learningStyle: jsonb("learning_style").default('{}'), // Capture learning preferences
});

export const wins = pgTable("wins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // achievement, milestone, daily_challenge, etc.
  xpReward: integer("xp_reward").default(0),
  coinReward: integer("coin_reward").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default('{}'),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull(), // common, rare, epic, legendary
  category: text("category").notNull(), // office_artifacts, tech_relics, startup_memorabilia, etc.
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userItems = pgTable("user_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  acquiredAt: timestamp("acquired_at").defaultNow(),
  source: text("source").notNull(), // e.g., "boss_battle", "achievement", "purchase"
  equipped: boolean("equipped").default(false),
  metadata: jsonb("metadata").default('{}'),
});


export const marketListings = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  price: integer("price").notNull(),
  listedAt: timestamp("listed_at").defaultNow(),
  active: boolean("active").default(true),
  metadata: jsonb("metadata").default('{}'),
});

export const userRelations = relations(users, ({ many, one }) => ({
  challenges: many(dailyChallenges),
  messages: many(chatMessages),
  userMilestones: many(userMilestones),
  wins: many(wins),
  currentMilestone: one(milestones, {
    fields: [users.currentMilestoneId],
    references: [milestones.id],
  }),
  inventory: many(userItems),
  marketListings: many(marketListings),
  businessMetrics: one(businessMetrics, {
    fields: [users.id],
    references: [businessMetrics.userId],
  }),
}));

export const winRelations = relations(wins, ({ one }) => ({
  user: one(users, {
    fields: [wins.userId],
    references: [users.id],
  }),
}));

export const challengeRelations = relations(dailyChallenges, ({ one }) => ({
  user: one(users, {
    fields: [dailyChallenges.userId],
    references: [users.id],
  }),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const userMilestoneRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userMilestones.userId],
    references: [users.id],
  }),
  milestone: one(milestones, {
    fields: [userMilestones.milestoneId],
    references: [milestones.id],
  }),
}));

export const milestoneRelations = relations(milestones, ({ many }) => ({
  userMilestones: many(userMilestones),
}));

export const itemRelations = relations(items, ({ many }) => ({
  owners: many(userItems),
}));

export const userItemRelations = relations(userItems, ({ one }) => ({
  user: one(users, {
    fields: [userItems.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [userItems.itemId],
    references: [items.id],
  }),
}));

export const marketListingRelations = relations(marketListings, ({ one }) => ({
  user: one(users, {
    fields: [marketListings.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [marketListings.itemId],
    references: [items.id],
  }),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type UserMilestone = typeof userMilestones.$inferSelect;
export type Win = typeof wins.$inferSelect;
export type InsertWin = typeof wins.$inferInsert;
export type Item = typeof items.$inferSelect;
export type UserItem = typeof userItems.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type InsertUserItem = typeof userItems.$inferInsert;

export const mentorPersonalities = {
  balanced: {
    name: "Balanced",
    description: "A well-rounded mentor balancing encouragement with practical advice",
  },
  motivational: {
    name: "Motivational",
    description: "Highly encouraging and enthusiastic, focusing on motivation and celebration",
  },
  analytical: {
    name: "Analytical",
    description: "Data-driven approach with detailed analysis and strategic planning",
  },
  challenger: {
    name: "Challenger",
    description: "Pushes you out of your comfort zone with challenging tasks and goals",
  },
} as const;

export type MentorPersonality = keyof typeof mentorPersonalities;
export type MarketListing = typeof marketListings.$inferSelect;
export type InsertMarketListing = typeof marketListings.$inferInsert;

export const businessMetrics = pgTable("business_metrics", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add relation to users
export const businessMetricsRelations = relations(businessMetrics, ({ one }) => ({
  user: one(users, {
    fields: [businessMetrics.userId],
    references: [users.id],
  }),
}));

export type BusinessMetrics = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetrics = typeof businessMetrics.$inferInsert;