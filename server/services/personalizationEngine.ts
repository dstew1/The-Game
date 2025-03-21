import { type User } from "@db/schema";
import { 
  businessIndustries, 
  skillCategories, 
  businessStages, 
  entrepreneurExperienceLevels 
} from "@db/schema";

export interface IndustryContext {
  industrySpecificGoals: string[];
  keyTerminology: string[];
  relevantMetrics: string[];
}

export interface PersonalizationResult {
  difficulty: number; // 1-5 scale
  focusAreas: string[]; // e.g., ["market_research", "finance"]
  suggestedSkills: string[]; // e.g., ["financial_analysis", "customer_research"]
  industryContext: IndustryContext;
  learningPreferences: {
    preferredTimeOfDay: string;
    preferredDuration: string;
    learningStyle: string;
  };
}

class PersonalizationEngine {
  private getIndustryContext(industry: string | null): IndustryContext {
    // Default context for general business
    const defaultContext: IndustryContext = {
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

    // Industry-specific contexts
    const industryContexts: Record<string, IndustryContext> = {
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
      },
      // Add more industry contexts as needed
    };

    return industryContexts[industry] || defaultContext;
  }

  private calculateDifficulty(
    completedMilestones: number,
    averageCompletionTime: number,
    experienceLevel: string | null
  ): number {
    let baseDifficulty = 1;

    // Adjust based on completed milestones
    if (completedMilestones > 20) baseDifficulty++;
    if (completedMilestones > 50) baseDifficulty++;

    // Adjust based on completion time efficiency
    if (averageCompletionTime < 24) baseDifficulty++;

    // Adjust based on experience
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

  private determineFocusAreas(
    user: User,
    completedMilestones: number
  ): string[] {
    const focusAreas = [];
    const skillLevels = user.skillLevels as Record<string, number> || {};

    // Find areas that need improvement
    const weakAreas = Object.entries(skillLevels)
      .filter(([_, level]) => level < 3)
      .map(([area]) => area);

    // Add 2-3 focus areas
    if (weakAreas.length > 0) {
      focusAreas.push(...weakAreas.slice(0, 2));
    }

    // Add business stage specific focus
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

    // Ensure we have at least 3 unique focus areas
    const defaultAreas = [
      "market_research",
      "financial_planning",
      "business_model"
    ];

    const uniqueFocusAreas = [...new Set([...focusAreas, ...defaultAreas])];
    return uniqueFocusAreas.slice(0, 4);
  }

  async getPersonalization(
    user: User,
    completedMilestones: number,
    averageCompletionTime: number
  ): Promise<PersonalizationResult> {
    const difficulty = this.calculateDifficulty(
      completedMilestones,
      averageCompletionTime,
      user.entrepreneurExperience
    );

    const focusAreas = this.determineFocusAreas(user, completedMilestones);
    const industryContext = this.getIndustryContext(user.businessIndustry);

    // Determine suggested skills based on focus areas and industry
    const suggestedSkills = focusAreas.map(area => {
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
}

export const personalizationEngine = new PersonalizationEngine();
