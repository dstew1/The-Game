import { type User } from "@db/schema";
import { getMentorResponse } from "./ai-mentor";
import { logger } from "./logger";
import { db } from "@db";
import { businessMetrics } from "@db/schema";
import { eq } from "drizzle-orm";

interface UserContext {
  industry: string;
  stage: string;
  experience: string;
  goals: string[];
  skills: Record<string, number>;
  progress: {
    completedMilestones: number;
    successRate: number;
    averageCompletion: number;
  };
  businessMetrics?: {
    businessName: string | null;
    industry: string | null;
    monthlyRevenue: string | null;
    shortTermGoals: string | null;
    challenges: string | null;
  };
}

export interface PersonalizationResult {
  difficulty: number;
  focusAreas: string[];
  suggestedSkills: string[];
  industryContext: {
    keyTerminology: string[];
    relevantMetrics: string[];
    industrySpecificGoals: string[];
  };
}

export class MilestonePersonalizationEngine {
  private async analyzeUserContext(user: User, completedMilestones: number, averageCompletion: number): Promise<UserContext> {
    logger.info("Analyzing user context for personalization", {
      userId: user.id,
      industry: user.businessIndustry,
      stage: user.businessStage,
      experience: user.entrepreneurExperience
    });

    // Fetch latest business metrics
    const metrics = await db.query.businessMetrics.findFirst({
      where: eq(businessMetrics.userId, user.id)
    });

    // Prioritize the most recent business metrics data
    const currentIndustry = metrics?.industry || user.businessIndustry || "general";

    return {
      industry: currentIndustry,
      stage: user.businessStage || "ideation",
      experience: user.entrepreneurExperience || "beginner",
      goals: (user.primaryGoals as string[]) || [],
      skills: (user.skillLevels as Record<string, number>) || {},
      progress: {
        completedMilestones,
        successRate: completedMilestones > 0 ? averageCompletion / completedMilestones : 0,
        averageCompletion
      },
      businessMetrics: metrics ? {
        businessName: metrics.businessName,
        industry: metrics.industry,
        monthlyRevenue: metrics.monthlyRevenue,
        shortTermGoals: metrics.shortTermGoals,
        challenges: metrics.challenges
      } : undefined
    };
  }

  private async getPersonalizationPrompt(context: UserContext): Promise<string> {
    const businessMetricsInfo = context.businessMetrics ? `
- Latest Business Metrics:
  * Business Name: ${context.businessMetrics.businessName || 'Not specified'}
  * Industry Focus: ${context.businessMetrics.industry || context.industry}
  * Monthly Revenue: ${context.businessMetrics.monthlyRevenue || 'Not specified'}
  * Current Goals: ${context.businessMetrics.shortTermGoals || 'Not specified'}
  * Main Challenges: ${context.businessMetrics.challenges || 'Not specified'}` : '';

    return `Analyze this entrepreneur's context and provide personalized milestone recommendations.
Focus heavily on their current business metrics and challenges when generating recommendations.

Context:
- Industry: ${context.industry}
- Business Stage: ${context.stage}
- Experience Level: ${context.experience}
- Goals: ${context.goals.join(", ")}
- Current Skills: ${JSON.stringify(context.skills)}
- Progress: Completed ${context.progress.completedMilestones} milestones
- Success Rate: ${Math.round(context.progress.successRate * 100)}%${businessMetricsInfo}

Please provide recommendations in JSON format:
{
  "difficulty": number (1-5),
  "focusAreas": string[],
  "suggestedSkills": string[],
  "industryContext": {
    "keyTerminology": string[],
    "relevantMetrics": string[],
    "industrySpecificGoals": string[]
  }
}`;
  }

  public async getPersonalization(
    user: User,
    completedMilestones: number,
    averageCompletion: number
  ): Promise<PersonalizationResult> {
    try {
      logger.info("Starting milestone personalization", {
        userId: user.id,
        completedMilestones,
        averageCompletion
      });

      const context = await this.analyzeUserContext(user, completedMilestones, averageCompletion);
      const prompt = await this.getPersonalizationPrompt(context);

      const response = await getMentorResponse(prompt, {
        userId: user.id,
        userLevel: user.level || 1,
        userXp: user.xp || 0,
        mentorPersonality: "analytical",
        businessIndustry: context.industry,
        businessStage: user.businessStage || undefined,
        entrepreneurExperience: user.entrepreneurExperience || undefined,
        primaryGoals: user.primaryGoals as string[],
        skillLevels: user.skillLevels as Record<string, number>,
      });

      try {
        const result = JSON.parse(response);
        const personalization: PersonalizationResult = {
          difficulty: result.difficulty || 1,
          focusAreas: result.focusAreas || ["fundamentals", "basics"],
          suggestedSkills: result.suggestedSkills || ["planning", "research"],
          industryContext: {
            keyTerminology: result.industryContext?.keyTerminology || [],
            relevantMetrics: result.industryContext?.relevantMetrics || [],
            industrySpecificGoals: result.industryContext?.industrySpecificGoals || []
          }
        };

        logger.info("Generated personalization result", {
          userId: user.id,
          difficulty: personalization.difficulty,
          focusAreas: personalization.focusAreas,
          suggestedSkills: personalization.suggestedSkills
        });

        return personalization;
      } catch (error) {
        logger.error("Error parsing personalization response", {
          userId: user.id,
          response,
          errorMessage: error instanceof Error ? error.message : String(error)
        });

        // Return default personalization if parsing fails
        return {
          difficulty: 1,
          focusAreas: ["basics", "fundamentals"],
          suggestedSkills: ["planning", "research"],
          industryContext: {
            keyTerminology: [],
            relevantMetrics: [],
            industrySpecificGoals: []
          }
        };
      }
    } catch (error) {
      logger.error("Error in personalization engine", {
        userId: user.id,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const personalizationEngine = new MilestonePersonalizationEngine();