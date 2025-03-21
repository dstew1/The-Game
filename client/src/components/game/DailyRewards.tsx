/**
 * DailyRewards Component
 * 
 * A React component that manages and displays the daily rewards system, including:
 * - Login streak tracking
 * - Daily DreamCoins claiming
 * - XP bonus calculations
 * - Animated celebrations for rewards
 * 
 * @component
 * 
 * Features:
 * - Real-time countdown timer for next reward
 * - Animated UI elements with hover effects
 * - Visual feedback for reward claims
 * - Streak bonus system
 * - Sound effects for celebrations
 * 
 * Dependencies:
 * - @tanstack/react-query for data fetching
 * - framer-motion for animations
 * - lucide-react for icons
 * - shadcn/ui components
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Flame, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { bounceScale, pulseVariants, fadeInScale } from "@/lib/animations";
import { soundEffect } from "@/lib/sounds";
import Celebration from "./Celebration";

// Animation variants for interactive elements
const cardHoverVariants = {
  initial: { scale: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

const buttonHoverVariants = {
  initial: { scale: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};

export default function DailyRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCoinsCelebration, setShowCoinsCelebration] = useState(false);
  const [showXpCelebration, setShowXpCelebration] = useState(false);
  const [rewardAmount, setRewardAmount] = useState({ coins: 0, xp: 0 });
  const [timeLeft, setTimeLeft] = useState<string>('');

  /**
   * Fetch rewards data with automatic refetch
   * Updates every minute to keep timer accurate
   */
  const { data: rewards, refetch } = useQuery({
    queryKey: ["/api/daily-rewards"],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 55000, // Consider data stale after 55 seconds
  });

  /**
   * Calculate and update time until next reward
   * Updates every second to show accurate countdown
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const calculateTimeLeft = () => {
      if (!rewards?.nextRewardTime) {
        setTimeLeft('');
        return;
      }

      const now = new Date().getTime();
      const nextReward = new Date(rewards.nextRewardTime).getTime();
      const difference = nextReward - now;

      if (difference <= 0) {
        setTimeLeft('Available now!');
        refetch(); // Refetch when timer hits zero
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Initial calculation
    calculateTimeLeft();

    // Set up interval
    timer = setInterval(calculateTimeLeft, 1000);

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [rewards?.nextRewardTime, refetch]);

  /**
   * Manage celebration animations and sounds
   * Shows coins celebration followed by XP celebration
   */
  useEffect(() => {
    let coinsTimeout: NodeJS.Timeout;
    let xpTimeout: NodeJS.Timeout;

    if (showCoinsCelebration) {
      soundEffect.playCoinSound();
      coinsTimeout = setTimeout(() => {
        setShowCoinsCelebration(false);
        setTimeout(() => {
          setShowXpCelebration(true);
          soundEffect.playXPSound();
          xpTimeout = setTimeout(() => {
            setShowXpCelebration(false);
          }, 2000);
        }, 500);
      }, 2000);
    }

    return () => {
      if (coinsTimeout) clearTimeout(coinsTimeout);
      if (xpTimeout) clearTimeout(xpTimeout);
    };
  }, [showCoinsCelebration]);

  /**
   * Mutation for claiming daily rewards
   * Handles success/error states and triggers celebrations
   */
  const { mutate: claimReward, isPending: isClaiming } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/daily-rewards/claim", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Immediately invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/daily-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setRewardAmount({ coins: data.dreamcoins, xp: data.xp });
      setShowCoinsCelebration(true);

      // Force an immediate refetch to get the new timer
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!rewards) {
    return null;
  }

  return (
    <>
      <motion.div
        variants={cardHoverVariants}
        initial="initial"
        whileHover="hover"
      >
        <Card className="bg-black border-primary">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Daily Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Login Streak Section */}
              <motion.div
                variants={fadeInScale}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="flex items-center justify-between p-4 border border-primary/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <motion.div variants={pulseVariants} animate="animate" whileHover="hover">
                    <Flame className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-primary font-medium">Login Streak</p>
                    <p className="text-gray-400">
                      {rewards.loginStreak} day{rewards.loginStreak !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Streak Bonus</p>
                  <p className="text-primary">+{rewards.streakBonus}% XP</p>
                </div>
              </motion.div>

              {/* Daily Claim Section */}
              <motion.div
                variants={fadeInScale}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="flex items-center justify-between p-4 border border-primary/20 rounded-lg"
              >
                <div>
                  <p className="text-primary font-medium">Daily DreamCoins</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    {rewards.canClaim ? (
                      "Available to claim!"
                    ) : timeLeft ? (
                      <span>Next reward in: {timeLeft}</span>
                    ) : (
                      <span>Loading...</span>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {rewards.canClaim && (
                    <motion.div
                      variants={buttonHoverVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        onClick={() => claimReward()}
                        disabled={!rewards.canClaim || isClaiming}
                        className="bg-primary text-black hover:bg-primary/90"
                      >
                        {isClaiming ? (
                          <Trophy className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trophy className="h-4 w-4 mr-2" />
                            Claim
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {rewards.canClaim && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-gray-400 text-sm"
                >
                  Claim your daily reward of 1,000 DreamCoins and bonus XP!
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Celebration Overlays */}
      <Celebration
        show={showCoinsCelebration}
        type="coins"
        value={rewardAmount.coins}
        message="Daily DreamCoins Claimed!"
      />

      <Celebration
        show={showXpCelebration}
        type="xp"
        value={rewardAmount.xp}
        message="Bonus XP Earned!"
      />
    </>
  );
}