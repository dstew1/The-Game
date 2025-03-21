import OpenAI from "openai";
import { type MentorPersonality } from "@db/schema";
import { db } from "@db";
import { businessMetrics } from "@db/schema";
import { eq } from "drizzle-orm";

// Using GPT-3.5 as requested by user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
});

const MENTOR_PERSONALITIES = {
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
- Keep formatting minimal and clean`,
} as const;

const BASE_PERSONALITY = `As a mentor in "The Game", a gamified entrepreneurship platform:
Remember to:
1. Keep responses clear and natural, avoid using markdown symbols or special formatting
2. Structure advice in simple paragraphs
3. Use clear language that's easy to read
4. Present information in a conversational way
5. Maintain a consistent, clean format without special characters or symbols
6. Tailor advice based on the user's profile:
   - Business: ${'{businessIndustry}'} industry, ${'{businessStage}'} stage
   - Experience: ${'{entrepreneurExperience}'}
   - Goals: ${'{goals}'}
   - Skills: ${'{skills}'}
   - Business Metrics:
     * Business Name: ${'{businessName}'}
     * Monthly Revenue: ${'{monthlyRevenue}'}
     * Customer Count: ${'{customerCount}'}
     * Social Followers: ${'{socialFollowers}'}
     * Employee Count: ${'{employeeCount}'}
     * Website Visitors: ${'{websiteVisitors}'}`; 

interface ChatContext {
  userId: number;
  userLevel: number;
  userXp: number;
  mentorPersonality: MentorPersonality;
  businessIndustry?: string;
  businessStage?: string;
  entrepreneurExperience?: string;
  primaryGoals?: string[];
  skillLevels?: Record<string, number>;
  businessMetrics?: {
    businessName?: string;
    monthlyRevenue?: number;
    customerCount?: number;
    socialFollowers?: number;
    employeeCount?: number;
    websiteVisitors?: number;
  };
}

export async function getMentorResponse(
  userMessage: string,
  context: ChatContext,
  previousMessages: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  try {
    // Fetch latest business metrics
    const metrics = await db.query.businessMetrics.findFirst({
      where: eq(businessMetrics.userId, context.userId)
    });

    let personalityPrompt = MENTOR_PERSONALITIES[context.mentorPersonality] + "\n\n";

    // Create a formatted version of BASE_PERSONALITY with user's context
    const baseWithContext = BASE_PERSONALITY
      .replace("{businessIndustry}", context.businessIndustry || "unspecified")
      .replace("{businessStage}", context.businessStage || "unspecified")
      .replace("{entrepreneurExperience}", context.entrepreneurExperience || "unspecified")
      .replace("{goals}", context.primaryGoals?.join(", ") || "unspecified")
      .replace("{skills}", Object.entries(context.skillLevels || {})
        .map(([skill, level]) => `${skill}: ${level}/5`)
        .join(", ") || "unspecified")
      .replace("{businessName}", metrics?.businessName || "unspecified")
      .replace("{monthlyRevenue}", metrics?.monthlyRevenue?.toString() || "0")
      .replace("{customerCount}", metrics?.customerCount?.toString() || "0")
      .replace("{socialFollowers}", metrics?.socialFollowers?.toString() || "0")
      .replace("{employeeCount}", metrics?.employeeCount?.toString() || "0")
      .replace("{websiteVisitors}", metrics?.websiteVisitors?.toString() || "0");

    personalityPrompt += baseWithContext;

    const messages = [
      { role: "system", content: personalityPrompt },
      ...previousMessages,
      {
        role: "system",
        content: `Current user stats: Level ${context.userLevel}, XP: ${context.userXp}`,
      },
      { role: "user", content: userMessage },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm processing your request...";
  } catch (error) {
    console.error("Error getting mentor response:", error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
  }
}