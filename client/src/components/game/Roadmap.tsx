import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Trophy, Target, Star, Timer, Crown } from "lucide-react";
import type { Milestone, UserMilestone } from "@db/schema";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MilestoneGenerationProgress from "./MilestoneGenerationProgress";
import MilestoneReward from "./MilestoneReward";

interface RoadmapTileProps {
  milestone: Milestone;
  userMilestone?: UserMilestone;
  isCurrent: boolean;
  onComplete: (milestoneId: number) => void;
  disabled: boolean;
}

function RoadmapTile({ milestone, userMilestone, isCurrent, onComplete, disabled }: RoadmapTileProps) {
  const isCompleted = userMilestone?.completed;
  const isBossBattle = milestone.type === "boss_battle";
  const canComplete = isCurrent && !isCompleted && !disabled;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative p-4 rounded-lg border-2 ${
        isCurrent
          ? "border-primary bg-primary/10"
          : isCompleted
          ? "border-green-500 bg-green-500/10"
          : "border-gray-700 bg-black"
      }`}
    >
      <div className="absolute -top-2 -right-2">
        {isBossBattle ? (
          <Crown className="h-6 w-6 text-primary" />
        ) : (
          <Target className="h-6 w-6 text-primary" />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-white">{milestone.title}</h3>
        <p className="text-sm text-gray-400">{milestone.description}</p>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-gray-400">{milestone.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-gray-400">{milestone.coinReward} Coins</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-gray-400">{milestone.estimatedDuration}</span>
          </div>
        </div>

        {canComplete && (
          <Button
            onClick={() => onComplete(milestone.id)}
            className="w-full mt-2"
          >
            Complete {isBossBattle ? "Boss Battle" : "Task"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function Roadmap() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    xpGained?: number;
    coinsGained?: number;
    reward?: any;
  } | null>(null);

  const { data: roadmapData, isLoading } = useQuery<{
    milestones: Milestone[];
    userMilestones: UserMilestone[];
    currentMilestoneId: number | null;
    dailyProgress: {
      completedToday: number;
      canComplete: boolean;
      completedBossBattleToday: boolean;
    };
  }>({
    queryKey: ["/api/roadmap"],
    retry: false,
  });

  const { mutate: completeMilestone, isPending } = useMutation({
    mutationFn: async (milestoneId: number) => {
      const response = await fetch(`/api/roadmap/milestones/${milestoneId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setSelectedMilestone(null);
      setReflection("");

      // Show reward animation
      setCurrentReward({
        xpGained: data.milestone?.xpReward,
        coinsGained: data.milestone?.coinReward,
        reward: data.rewards
      });
      setShowReward(true);

      // Delay the success toast until after the reward animation
      setTimeout(() => {
        toast({
          title: "Milestone completed!",
          description: "Keep up the great work on your entrepreneurial journey!",
        });
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = (milestoneId: number) => {
    setSelectedMilestone(milestoneId);
  };

  const handleSubmitReflection = () => {
    if (selectedMilestone) {
      completeMilestone(selectedMilestone);
    }
  };

  if (isLoading || !roadmapData) {
    return (
      <Card className="bg-black border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 relative">
            <MilestoneGenerationProgress isGenerating={true} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { milestones, userMilestones, currentMilestoneId, dailyProgress } = roadmapData;

  return (
    <>
      <Card className="bg-black border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Your Journey</CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Completed today: {dailyProgress.completedToday}/5</span>
            {dailyProgress.completedBossBattleToday && (
              <span className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-primary" />
                Boss battle completed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="grid grid-cols-1 gap-6 p-4">
              {milestones.map((milestone) => {
                const userMilestone = userMilestones.find(
                  (um) => um.milestoneId === milestone.id
                );
                const isCurrent = milestone.id === currentMilestoneId;
                return (
                  <RoadmapTile
                    key={milestone.id}
                    milestone={milestone}
                    userMilestone={userMilestone}
                    isCurrent={isCurrent}
                    onComplete={handleComplete}
                    disabled={!dailyProgress.canComplete}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reflection Dialog */}
      <Dialog open={selectedMilestone !== null} onOpenChange={() => setSelectedMilestone(null)}>
        <DialogContent className="bg-black border-primary">
          <DialogHeader>
            <DialogTitle className="text-primary">Complete Milestone</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share your thoughts and learnings from this milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What did you learn? What challenges did you face? How will you apply this knowledge?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="h-32 bg-black border-primary text-white"
            />
            <Button
              onClick={handleSubmitReflection}
              disabled={isPending || !reflection.trim()}
              className="w-full"
            >
              {isPending ? "Submitting..." : "Submit & Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Animation */}
      <MilestoneReward
        isOpen={showReward}
        onClose={() => setShowReward(false)}
        xpGained={currentReward?.xpGained}
        coinsGained={currentReward?.coinsGained}
        reward={currentReward?.reward}
      />
    </>
  );
}