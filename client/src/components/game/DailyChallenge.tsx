import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Brain, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { cardHoverVariants, buttonHoverVariants, fadeInScale } from "@/lib/animations";
import { soundEffect } from "@/lib/sounds";

interface Challenge {
  id: number;
  description: string;
  type: "task" | "quiz";
  xpReward: number;
  coinReward: number;
  completed: boolean;
  options?: string[];
  correctAnswer?: string;
}

export default function DailyChallenge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/daily-challenges"],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { mutate: completeChallenge } = useMutation({
    mutationFn: async ({ id, answer }: { id: number; answer?: string }) => {
      const response = await fetch(`/api/daily-challenges/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onMutate: async (variables) => {
      setCompletingId(variables.id);
    },
    onSuccess: (data) => {
      // Play completion sounds with a slight delay between them
      soundEffect.playCoinSound();
      setTimeout(() => {
        soundEffect.playXPSound();
      }, 300);

      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: ["/api/daily-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/xp"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/dreamcoins"] });

      toast({
        title: "Challenge Completed!",
        description: `You earned ${data.challenge.xpReward} XP and ${data.challenge.coinReward} DreamCoins!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setCompletingId(null);
      setSelectedAnswer("");
    },
  });

  const handleComplete = (challenge: Challenge) => {
    if (challenge.type === "quiz" && !selectedAnswer) {
      toast({
        title: "Select an Answer",
        description: "Please select an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    completeChallenge({
      id: challenge.id,
      answer: challenge.type === "quiz" ? selectedAnswer : undefined,
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-black border-primary">
        <CardHeader>
          <CardTitle className="text-primary animate-pulse">
            Loading Challenges...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="initial"
      whileHover="hover"
    >
      <Card className="bg-black border-primary">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                variants={fadeInScale}
                initial="initial"
                animate="animate"
                className={`relative p-4 border rounded-lg ${
                  challenge.completed
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {challenge.type === "quiz" ? (
                        <Brain className="h-4 w-4 text-primary" />
                      ) : (
                        <Trophy className="h-4 w-4 text-primary" />
                      )}
                      <p className="text-primary font-medium">{challenge.description}</p>
                    </div>

                    {challenge.type === "quiz" && !challenge.completed && (
                      <RadioGroup
                        value={selectedAnswer}
                        onValueChange={setSelectedAnswer}
                        className="mt-4"
                      >
                        {challenge.options?.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-400">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    <p className="text-gray-400 text-sm">
                      Rewards: {challenge.xpReward} XP, {challenge.coinReward} DreamCoins
                    </p>
                  </div>

                  <motion.div
                    variants={buttonHoverVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      disabled={challenge.completed || completingId === challenge.id}
                      onClick={() => handleComplete(challenge)}
                      variant={challenge.completed ? "ghost" : "default"}
                      className={challenge.completed ? "text-green-500" : "bg-primary text-black"}
                    >
                      {challenge.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : completingId === challenge.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Trophy className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        "Complete"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}