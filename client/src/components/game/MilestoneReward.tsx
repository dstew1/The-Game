import { motion, AnimatePresence } from "framer-motion";
import { Star, Gift, Sparkles, Award } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MilestoneReward {
  type: "item";
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  xpGained?: number;
  coinsGained?: number;
  reward?: MilestoneReward;
}

const rarityColors = {
  common: "text-gray-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400"
};

const rarityAnimations = {
  common: {},
  rare: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1,
      repeat: Infinity
    }
  },
  epic: {
    scale: [1, 1.2, 1],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity
    }
  },
  legendary: {
    scale: [1, 1.3, 1],
    rotate: [0, 10, -10, 0],
    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
    transition: {
      duration: 2,
      repeat: Infinity
    }
  }
};

const ParticleEffect = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-primary rounded-full"
        initial={{
          opacity: 0,
          x: "50%",
          y: "50%",
          scale: 0
        }}
        animate={{
          opacity: [0, 1, 0],
          x: `${50 + Math.cos(i * 30 * (Math.PI / 180)) * 100}%`,
          y: `${50 + Math.sin(i * 30 * (Math.PI / 180)) * 100}%`,
          scale: [0, 1.5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeOut"
        }}
      />
    ))}
  </div>
);

export default function MilestoneReward({ isOpen, onClose, xpGained, coinsGained, reward }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-primary max-w-md overflow-hidden">
        <ParticleEffect />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10"
        >
          <DialogTitle className="text-primary text-center text-2xl font-bold mb-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="inline-flex items-center gap-2"
            >
              <Award className="h-6 w-6 text-primary" />
              Milestone Complete!
            </motion.div>
          </DialogTitle>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-gray-400 mb-6"
          >
            You've achieved another milestone in your entrepreneurial journey!
          </motion.p>
        </motion.div>

        <AnimatePresence>
          <div className="space-y-8 p-4 relative z-10">
            {/* XP and Coins Animation - Always show if they exist */}
            <motion.div
              className="flex justify-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {xpGained && xpGained > 0 && (
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotateZ: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.2,
                    times: [0, 0.2, 0.8, 1],
                    repeat: 2
                  }}
                >
                  <div className="relative">
                    <Star className="h-8 w-8 text-yellow-400 mb-2" />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <Star className="h-8 w-8 text-yellow-400" />
                    </motion.div>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">+{xpGained} XP</span>
                </motion.div>
              )}

              {coinsGained && coinsGained > 0 && (
                <motion.div
                  className="flex flex-col items-center"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotateZ: [0, -10, 10, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.4,
                    times: [0, 0.2, 0.8, 1],
                    repeat: 2
                  }}
                >
                  <div className="relative">
                    <Gift className="h-8 w-8 text-primary mb-2" />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.2
                      }}
                    >
                      <Gift className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                  <span className="text-xl font-bold text-primary">+{coinsGained} Coins</span>
                </motion.div>
              )}
            </motion.div>

            {/* Item Reward Animation */}
            {reward && (
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="relative inline-block"
                  animate={rarityAnimations[reward.rarity]}
                >
                  <div className={`text-6xl mb-4 ${rarityColors[reward.rarity]}`}>
                    🎁
                  </div>
                  <motion.div
                    className="absolute -inset-4 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className={`h-6 w-6 ${rarityColors[reward.rarity]}`} />
                  </motion.div>
                </motion.div>

                <h3 className={`text-xl font-bold ${rarityColors[reward.rarity]}`}>
                  {reward.name}
                </h3>
                <p className="text-gray-400">{reward.description}</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className={`capitalize ${rarityColors[reward.rarity]}`}>
                    {reward.rarity}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400 capitalize">
                    {reward.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}