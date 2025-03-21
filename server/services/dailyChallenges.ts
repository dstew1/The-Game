import { db } from "@db";
import { dailyChallenges, users, type User } from "@db/schema";
import { and, eq, gte } from "drizzle-orm";
import { logger } from "./logger";

const CHALLENGES_PER_DAY = 3;

// Challenge categories mapped to business stages
const challengeCategories = {
  ideation: ["market_research", "validation", "planning", "ideation", "customer_discovery"],
  startup: ["product_development", "marketing", "sales", "operations", "customer_acquisition"],
  growth: ["scaling", "optimization", "management", "team_building", "process_improvement"],
  established: ["expansion", "innovation", "leadership", "strategic_planning", "market_expansion"]
} as const;

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Dynamic challenge templates based on user's context
function getChallengeTemplates(user: User) {
  const businessStage = user.businessStage || "ideation";
  const experience = user.entrepreneurExperience || "beginner";
  const industry = user.businessIndustry || "general";

  const baseTemplates = [
    // General Business Development
    {
      type: "task" as const,
      category: "daily_progress",
      description: "Update your business progress tracker with today's key metrics",
      xpReward: 50,
      coinReward: 100,
    },
    {
      type: "task" as const,
      category: "networking",
      description: "Connect with another entrepreneur in your industry on LinkedIn",
      xpReward: 75,
      coinReward: 150,
    },
    {
      type: "task" as const,
      category: "learning",
      description: "Read an industry report or case study relevant to your business",
      xpReward: 60,
      coinReward: 120,
    },
    {
      type: "task" as const,
      category: "productivity",
      description: "Create a prioritized task list for your next business milestone",
      xpReward: 45,
      coinReward: 90,
    },
    // Market Research Quizzes
    {
      type: "quiz" as const,
      category: "market_research",
      description: "What's the first step in validating a business idea?",
      options: [
        "Build a complete product",
        "Talk to potential customers",
        "Create a business plan",
        "Design a logo",
      ],
      correctAnswer: "Talk to potential customers",
      xpReward: 100,
      coinReward: 200,
    },
    {
      type: "quiz" as const,
      category: "business_strategy",
      description: "Which of these is NOT a valid way to validate market demand?",
      options: [
        "Creating a landing page to gauge interest",
        "Conducting customer interviews",
        "Building a full product without feedback",
        "Running small-scale tests",
      ],
      correctAnswer: "Building a full product without feedback",
      xpReward: 90,
      coinReward: 180,
    },
    {
      type: "quiz" as const,
      category: "finance",
      description: "What's the most important financial metric for an early-stage startup?",
      options: [
        "Revenue Growth",
        "Burn Rate",
        "Profit Margin",
        "Total Assets",
      ],
      correctAnswer: "Burn Rate",
      xpReward: 95,
      coinReward: 190,
    },
    // Time Management
    {
      type: "task" as const,
      category: "productivity",
      description: "Implement a time-tracking system for your daily business activities",
      xpReward: 70,
      coinReward: 140,
    },
    // Customer Development
    {
      type: "task" as const,
      category: "customer_research",
      description: "Conduct at least 3 customer interviews to gather product feedback",
      xpReward: 120,
      coinReward: 240,
    }
  ];

  // Enhanced industry-specific templates based on user's business metrics
  const industryTemplates = {
    technology: [
      {
        type: "task" as const,
        category: "product_development",
        description: "Create a technical specification document for your main feature",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "quiz" as const,
        category: "tech_trends",
        description: "Which development methodology is best for rapid iteration?",
        options: ["Waterfall", "Agile", "V-Model", "Big Bang"],
        correctAnswer: "Agile",
        xpReward: 100,
        coinReward: 200,
      },
      {
        type: "task" as const,
        category: "security",
        description: "Perform a basic security audit of your application",
        xpReward: 150,
        coinReward: 300,
      },
      {
        type: "quiz" as const,
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
        coinReward: 220,
      },
      {
        type: "task" as const,
        category: "tech_growth",
        description: "Analyze your application's performance metrics and identify optimization opportunities",
        xpReward: 130,
        coinReward: 260,
      },
      {
        type: "task" as const,
        category: "tech_security",
        description: "Review and update your application's security measures",
        xpReward: 140,
        coinReward: 280,
      }
    ],
    ecommerce: [
      {
        type: "task" as const,
        category: "inventory",
        description: "Analyze your top-selling products and optimize inventory levels",
        xpReward: 90,
        coinReward: 180,
      },
      {
        type: "quiz" as const,
        category: "retail_operations",
        description: "What's the most important metric for an e-commerce business?",
        options: ["Total Revenue", "Customer Lifetime Value", "Number of Products", "Website Traffic"],
        correctAnswer: "Customer Lifetime Value",
        xpReward: 110,
        coinReward: 220,
      },
      {
        type: "task" as const,
        category: "customer_service",
        description: "Review and respond to all customer feedback from the past week",
        xpReward: 100,
        coinReward: 200,
      },
      {
        type: "task" as const,
        category: "marketing",
        description: "Optimize product descriptions for SEO on your top 5 products",
        xpReward: 130,
        coinReward: 260,
      },
     {
        type: "task" as const,
        category: "ecommerce_optimization",
        description: "Optimize your product pages for conversion rate",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "task" as const,
        category: "inventory_management",
        description: "Review and optimize your inventory management system",
        xpReward: 110,
        coinReward: 220,
      }
    ],
    services: [
      {
        type: "task" as const,
        category: "service_delivery",
        description: "Document your service delivery process and identify improvement areas",
        xpReward: 110,
        coinReward: 220,
      },
      {
        type: "quiz" as const,
        category: "service_business",
        description: "What's the most effective way to price services?",
        options: ["Hourly Rate", "Value-Based Pricing", "Cost-Plus Pricing", "Market Rate"],
        correctAnswer: "Value-Based Pricing",
        xpReward: 100,
        coinReward: 200,
      },
      {
        type: "task" as const,
        category: "client_management",
        description: "Create a client onboarding checklist for your services",
        xpReward: 120,
        coinReward: 240,
      }
    ],
    health: [
      {
        type: "task" as const,
        category: "compliance",
        description: "Review and update your health & safety compliance documentation",
        xpReward: 140,
        coinReward: 280,
      },
      {
        type: "quiz" as const,
        category: "healthcare",
        description: "What's the most important factor in healthcare business success?",
        options: ["Location", "Patient Satisfaction", "Equipment Quality", "Marketing"],
        correctAnswer: "Patient Satisfaction",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "task" as const,
        category: "patient_care",
        description: "Develop a patient feedback collection system",
        xpReward: 130,
        coinReward: 260,
      }
    ],
    education: [
      {
        type: "task" as const,
        category: "curriculum",
        description: "Create an outline for a new course or training program",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "quiz" as const,
        category: "edtech",
        description: "What's the most effective way to measure learning outcomes?",
        options: ["Test Scores", "Student Engagement", "Completion Rates", "Student Feedback"],
        correctAnswer: "Student Engagement",
        xpReward: 110,
        coinReward: 220,
      },
      {
        type: "task" as const,
        category: "student_success",
        description: "Analyze student progress data and identify improvement areas",
        xpReward: 130,
        coinReward: 260,
      }
    ],
    food: [
      {
        type: "task" as const,
        category: "food_safety",
        description: "Conduct a comprehensive food safety audit of your operations",
        xpReward: 150,
        coinReward: 300,
      },
      {
        type: "quiz" as const,
        category: "food_business",
        description: "What's the most important factor in food business profitability?",
        options: ["Menu Pricing", "Food Cost Control", "Marketing", "Location"],
        correctAnswer: "Food Cost Control",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "task" as const,
        category: "menu_engineering",
        description: "Analyze your menu items' profitability and popularity",
        xpReward: 140,
        coinReward: 280,
      }
    ]
  };

  // Stage-specific challenges
  const stageSpecificTemplates = {
    idea: [
      {
        type: "task" as const,
        category: "validation",
        description: "Create a simple landing page to test your business concept",
        xpReward: 100,
        coinReward: 200,
      },
      {
        type: "quiz" as const,
        category: "ideation",
        description: "What's the most important factor in idea validation?",
        options: ["Market Size", "Customer Need", "Competition", "Technology"],
        correctAnswer: "Customer Need",
        xpReward: 90,
        coinReward: 180,
      }
    ],
    planning: [
      {
        type: "task" as const,
        category: "business_planning",
        description: "Draft your business model canvas",
        xpReward: 130,
        coinReward: 260,
      },
      {
        type: "quiz" as const,
        category: "planning",
        description: "What should be the first section of your business plan?",
        options: ["Financials", "Executive Summary", "Market Analysis", "Team"],
        correctAnswer: "Executive Summary",
        xpReward: 100,
        coinReward: 200,
      }
    ],
    startup: [
      {
        type: "task" as const,
        category: "growth",
        description: "Set up your customer acquisition tracking system",
        xpReward: 120,
        coinReward: 240,
      },
      {
        type: "quiz" as const,
        category: "startup_metrics",
        description: "What's the most important early-stage startup metric?",
        options: ["Revenue", "User Growth", "Profit", "Market Share"],
        correctAnswer: "User Growth",
        xpReward: 110,
        coinReward: 220,
      }
    ],
    established: [
      {
        type: "task" as const,
        category: "scaling",
        description: "Create a 90-day scaling plan for your business",
        xpReward: 150,
        coinReward: 300,
      },
      {
        type: "quiz" as const,
        category: "business_growth",
        description: "What's the most effective way to scale an established business?",
        options: ["Hiring More Staff", "Process Automation", "Marketing", "New Products"],
        correctAnswer: "Process Automation",
        xpReward: 130,
        coinReward: 260,
      }
    ]
  };

  // Use a combination of time-based and user-based seed for randomization
  let seed = user.id + new Date().getDate();
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Get all possible templates
  const allTemplates = [
    ...baseTemplates,
    ...(industryTemplates[industry as keyof typeof industryTemplates] || []),
    ...(stageSpecificTemplates[businessStage as keyof typeof stageSpecificTemplates] || [])
  ];

  // Ensure we have enough variety by mixing different types
  const taskTemplates = allTemplates.filter(t => t.type === "task");
  const quizTemplates = allTemplates.filter(t => t.type === "quiz");

  // Always include at least one quiz if available
  const selectedTemplates = [];
  if (quizTemplates.length > 0) {
    selectedTemplates.push(...getRandomItems(quizTemplates, 1));
  }

  // Fill the rest with a mix of tasks
  const remainingCount = CHALLENGES_PER_DAY - selectedTemplates.length;
  if (remainingCount > 0 && taskTemplates.length > 0) {
    selectedTemplates.push(...getRandomItems(taskTemplates, remainingCount));
  }

  // If we still need more challenges, add from the general pool
  while (selectedTemplates.length < CHALLENGES_PER_DAY) {
    const remaining = allTemplates.filter(t => !selectedTemplates.includes(t));
     if (remaining.length === 0) break;
    selectedTemplates.push(...getRandomItems(remaining, 1));
  }


  // Adjust difficulty and rewards based on user's level and experience
    const levelMultiplier = Math.max(1, Math.floor(user.level / 10) * 0.2 + 1);
  const expMultiplier = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2
  }[experience as keyof typeof expMultiplier] || 1;

  // Add slight randomization to rewards for variety
  return selectedTemplates.map(template => ({
    ...template,
    xpReward: Math.round(template.xpReward * levelMultiplier * expMultiplier * (0.9 + random() * 0.2)),
    coinReward: Math.round(template.coinReward * levelMultiplier * expMultiplier * (0.9 + random() * 0.2))
  }));
}

async function getRandomUniqueChallenge(
  templates: ReturnType<typeof getChallengeTemplates>,
  user: User,
  count: number
): Promise<ReturnType<typeof getChallengeTemplates>> {
  try {
    // Get user's challenge history
    let challengeHistory: string[] = [];
    try {
      const rawHistory = user.challengeHistory;
      if (Array.isArray(rawHistory)) {
        challengeHistory = rawHistory;
      } else if (typeof rawHistory === 'string') {
        challengeHistory = JSON.parse(rawHistory);
      }
      // Keep only last 90 days of challenges to allow recycling of older ones
      challengeHistory = challengeHistory.slice(-90);
    } catch (error) {
      logger.warn("Error parsing challenge history, using empty array", {
        userId: user.id,
        error
      });
    }

    // Filter out recently used challenges
    const availableTemplates = templates.filter(
      template => !challengeHistory.includes(template.description)
    );

    // If running low on unique challenges, remove older ones from history
    if (availableTemplates.length < count) {
      logger.info("Running out of unique challenges, resetting history", {
        userId: user.id,
        availableCount: availableTemplates.length,
        requestedCount: count
      });

      // Reset challenge history
      await db.update(users)
        .set({ challengeHistory: [] })
        .where(eq(users.id, user.id));

      // Use all templates
      return templates
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
    }

    // Prioritize challenges based on user's goals and skill levels
    const prioritizedTemplates = availableTemplates.sort((a, b) => {
      let aScore = 0;
      let bScore = 0;

      // Boost score for challenges matching user's primary goals
      if (user.primaryGoals?.includes(a.category)) aScore += 2;
      if (user.primaryGoals?.includes(b.category)) bScore += 2;

      // Boost score for challenges in areas where user has lower skill levels
      const skillLevels = user.skillLevels as Record<string, number> || {};
      if (skillLevels[a.category] < 3) aScore += 1;
      if (skillLevels[b.category] < 3) bScore += 1;

      return bScore - aScore; // Higher score first
    });

    // Take top N challenges after prioritization
    return prioritizedTemplates.slice(0, count);
  } catch (error) {
    logger.error("Error getting unique challenges", error, {
      userId: user.id,
      templatesCount: templates.length
    });
    throw error;
  }
}

export async function getDailyChallenges(user: User) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    logger.info("Starting to fetch daily challenges", {
      userId: user.id,
      businessStage: user.businessStage,
      experience: user.entrepreneurExperience
    });

    // Check if user has challenges for today
    const existingChallenges = await db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          eq(dailyChallenges.userId, user.id),
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

    // Generate new personalized challenges
    const templates = getChallengeTemplates(user);
    const newChallenges = await getRandomUniqueChallenge(templates, user, CHALLENGES_PER_DAY);

    logger.info("Generated new challenge templates", {
      userId: user.id,
      challengeCount: newChallenges.length
    });

    // Insert new challenges
    const insertedChallenges = await db
      .insert(dailyChallenges)
      .values(
        newChallenges.map(challenge => ({
          userId: user.id,
          description: challenge.description,
          type: challenge.type,
          xpReward: challenge.xpReward,
          coinReward: challenge.coinReward,
          options: challenge.options,
          correctAnswer: challenge.correctAnswer,
          aiGenerated: false,
          createdAt: new Date(),
          completed: false
        }))
      )
      .returning();

    // Update user's challenge history
    let challengeHistory: string[] = [];
    try {
      const rawHistory = user.challengeHistory;
      if (Array.isArray(rawHistory)) {
        challengeHistory = rawHistory;
      } else if (typeof rawHistory === 'string') {
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
      ...newChallenges.map(c => c.description)
    ];

    await db
      .update(users)
      .set({ challengeHistory: updatedHistory })
      .where(eq(users.id, user.id));

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