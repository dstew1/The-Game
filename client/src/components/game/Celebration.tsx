import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Coins } from "lucide-react";
import { celebrationVariants } from "@/lib/animations";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CelebrationProps {
  show: boolean;
  type: "xp" | "coins" | "achievement";
  value?: number;
  message?: string;
  onComplete?: () => void;
}

export default function Celebration({ 
  show, 
  type, 
  value, 
  message,
  onComplete 
}: CelebrationProps) {
  useEffect(() => {
    let animationFrame: number;

    if (show) {
      const end = Date.now() + 700;

      const frame = () => {
        confetti({
          particleCount: 25,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        });

        confetti({
          particleCount: 25,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        });

        if (Date.now() < end) {
          animationFrame = requestAnimationFrame(frame);
        }
      };

      frame();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [show]);

  const Icon = {
    xp: Star,
    coins: Coins,
    achievement: Trophy
  }[type];

  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-black p-8 rounded-lg border-2 border-primary text-center"
            variants={celebrationVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.2, 1.2, 1.2, 1.2, 1],
              }}
              transition={{ duration: 1.5 }}
              className="inline-block"
            >
              <Icon className="h-12 w-12 text-primary mb-4" />
            </motion.div>
            {value !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-primary mb-2"
              >
                +{value}
              </motion.div>
            )}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-lg"
            >
              {message || `You earned ${value} ${type}!`}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}