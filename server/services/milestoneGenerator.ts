import { type User } from "@db/schema";
import { getMentorResponse } from "./ai-mentor";
import { personalizationEngine, type PersonalizationResult } from "./milestonePersonalizationEngine";
import { logger } from "./logger";

type MilestoneReward = {
  type: "item";
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "office_artifacts" | "tech_relics" | "startup_memorabilia" | "business_tools" | "corporate_treasures";
};

type MilestoneRequirements = {
  fields: string[];
  rewards?: {
    items: MilestoneReward[];
  };
};

export type GeneratedMilestone = {
  title: string;
  description: string;
  type: "task" | "boss_battle";
  category: string;
  difficulty: number;
  estimatedDuration: string;
  xpReward: number;
  coinReward: number;
  order: number;
  requirements: MilestoneRequirements;
  aiGenerated: boolean;
};

// Comprehensive list of fun business-themed collectible items
export const MILESTONE_ITEMS: MilestoneReward[] = [
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

async function generateDailyMilestones(
  user: User,
  personalization: PersonalizationResult
): Promise<GeneratedMilestone[]> {
  const milestones: GeneratedMilestone[] = [];
  const DAILY_MILESTONE_COUNT = 5;

  // Base rewards that scale with user's level and personalization
  const baseTaskXP = 100 * personalization.difficulty;
  const baseTaskCoins = 50 * personalization.difficulty;
  const baseBossXP = 500 * personalization.difficulty;
  const baseBossCoins = 250 * personalization.difficulty;

  for (let i = 0; i < DAILY_MILESTONE_COUNT; i++) {
    const isBossBattle = i === DAILY_MILESTONE_COUNT - 1; // Last milestone is always a boss battle
    const content = await generateMilestoneContent(i + 1, user, isBossBattle, personalization);

    const milestone: GeneratedMilestone = {
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
        ...(isBossBattle && {
          rewards: {
            items: [selectRandomItem()] // Boss battles reward one random item
          }
        })
      },
      aiGenerated: true
    };

    milestones.push(milestone);
  }

  return milestones;
}

// Function to select a random item based on rarity probabilities
function selectRandomItem(): MilestoneReward {
  const rarityProbabilities = [
    { rarity: "common", chance: 0.60 },    // 60% chance
    { rarity: "rare", chance: 0.25 },      // 25% chance
    { rarity: "epic", chance: 0.10 },      // 10% chance
    { rarity: "legendary", chance: 0.05 }  // 5% chance
  ];

  const roll = Math.random();
  let cumulative = 0;
  const selectedRarity = rarityProbabilities.find(r => {
    cumulative += r.chance;
    return roll <= cumulative;
  })!.rarity;

  // Filter items by selected rarity and pick a random one
  const itemsOfRarity = MILESTONE_ITEMS.filter(item => item.rarity === selectedRarity);
  return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
}

async function generateMilestoneContent(
  phase: number,
  user: User,
  isBossBattle: boolean,
  personalization: PersonalizationResult
): Promise<{
  title: string;
  description: string;
  category: string;
  fields: string[];
}> {
  const prompt = `Generate a unique ${personalization.difficulty}/5 difficulty business milestone ${isBossBattle ? 'boss battle' : 'task'} for phase ${phase} of 5.

Context:
- Industry: ${personalization.industryContext.keyTerminology.length > 0 ? 'Focusing on ' + personalization.industryContext.keyTerminology.join(', ') : user.businessIndustry || 'General'}
- Business Stage: ${user.businessStage || 'Ideation'}
- Experience Level: ${user.entrepreneurExperience || 'Beginner'}
- Primary Goals: ${(user.primaryGoals as string[])?.join(', ') || 'Not specified'}
- Focus Areas: ${personalization.focusAreas.join(', ')}
- Industry-Specific Goals: ${personalization.industryContext.industrySpecificGoals.join(', ')}
- Key Metrics to Track: ${personalization.industryContext.relevantMetrics.join(', ')}

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
    businessIndustry: personalization.industryContext.keyTerminology.length > 0 
      ? personalization.industryContext.keyTerminology[0]  // Use the most relevant industry term
      : user.businessIndustry || undefined,
    businessStage: user.businessStage || undefined,
    entrepreneurExperience: user.entrepreneurExperience || undefined,
    primaryGoals: user.primaryGoals as string[],
    skillLevels: user.skillLevels as Record<string, number>,
  });

  try {
    const content = JSON.parse(response);
    return {
      title: isBossBattle ? `Boss Battle: ${content.title}` : content.title,
      description: isBossBattle 
        ? `${content.description}\n\nComplete this boss battle to earn XP, coins, and a mystical business item!`
        : content.description,
      category: content.category,
      fields: content.fields,
    };
  } catch (error) {
    logger.error("Error parsing milestone content", {
      error: error instanceof Error ? error.message : String(error),
      userId: user.id,
      phase,
      isBossBattle
    });
    return {
      title: isBossBattle 
        ? "Boss Battle: Industry Challenge" 
        : "Business Development Task",
      description: `Complete key ${isBossBattle ? 'objectives' : 'tasks'} for your ${user.businessIndustry || 'business'} venture${
        isBossBattle ? ' and earn XP, coins, and a mystical business item!' : ''
      }`,
      category: "development",
      fields: ["planningDocument", "implementation", "results"],
    };
  }
}

export { generateDailyMilestones };