/**
 * MentorReactions Component
 * 
 * A React component that displays animated reactions based on the AI mentor's messages.
 * These reactions provide visual feedback and enhance the interactivity of mentor interactions.
 * 
 * @component
 * 
 * Features:
 * - Dynamic reaction selection based on message content
 * - Animated icons using Framer Motion
 * - Multiple reaction types (celebration, insight, achievement, goal, progress)
 * - Automatic reaction timing and cleanup
 * 
 * Dependencies:
 * - framer-motion for animations
 * - lucide-react for icons
 */

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Lightbulb, Target, Sparkles } from "lucide-react";

interface MentorReactionsProps {
  message: string;
}

/**
 * Reaction configuration object
 * Each reaction type has an associated icon and animation properties
 */
const reactions = {
  celebration: {
    icon: Trophy,
    animation: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
    },
  },
  insight: {
    icon: Lightbulb,
    animation: {
      scale: [1, 1.1, 1],
      opacity: [0.5, 1, 0.5],
    },
  },
  achievement: {
    icon: Star,
    animation: {
      scale: [1, 1.3, 1],
      rotate: [0, 180, 360],
    },
  },
  goal: {
    icon: Target,
    animation: {
      scale: [1, 1.15, 1],
      rotate: [0, 45, 0],
    },
  },
  progress: {
    icon: Sparkles,
    animation: {
      scale: [1, 1.2, 1],
      y: [0, -5, 0],
    },
  },
};

/**
 * Analyzes message content to determine appropriate reaction type
 * 
 * @param {string} message - The mentor's message to analyze
 * @returns {string|null} The reaction type or null if no matching reaction
 */
function determineReaction(message: string) {
  const lowercase = message.toLowerCase();
  if (lowercase.includes("congratulations") || lowercase.includes("great job")) {
    return "celebration";
  }
  if (lowercase.includes("level up") || lowercase.includes("achievement")) {
    return "achievement";
  }
  if (lowercase.includes("understand") || lowercase.includes("here's what")) {
    return "insight";
  }
  if (lowercase.includes("goal") || lowercase.includes("target")) {
    return "goal";
  }
  if (lowercase.includes("progress") || lowercase.includes("moving forward")) {
    return "progress";
  }
  return null;
}

export default function MentorReactions({ message }: MentorReactionsProps) {
  const reactionType = determineReaction(message);
  if (!reactionType) return null;

  const { icon: Icon, animation } = reactions[reactionType as keyof typeof reactions];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={animation}
        transition={{ duration: 0.5, repeat: 0 }}
        className="absolute -left-8 -top-2"
      >
        <Icon className="h-6 w-6 text-primary" />
      </motion.div>
    </AnimatePresence>
  );
}