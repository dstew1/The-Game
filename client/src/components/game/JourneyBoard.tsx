import { motion } from "framer-motion";
import { Trophy, Star, Target, ArrowRight, Lock, Loader2, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { useState } from "react";
import MilestoneCompletion from "./MilestoneCompletion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Milestone {
  id: number;
  title: string;
  description: string;
  type: "task" | "boss_battle";
  category: string;
  difficulty: number;
  estimatedDuration: string;
  xpReward: number;
  coinReward: number;
  requirements: any;
}

interface UserMilestone {
  id: number;
  userId: number;
  milestoneId: number;
  completed: boolean;
  completedAt: string | null;
  reflection: string | null;
}

interface DailyProgress {
  completedToday: number;
  canComplete: boolean;
  completedBossBattleToday: boolean;
}

interface RoadmapData {
  milestones: Milestone[];
  userMilestones: UserMilestone[];
  currentMilestoneId: number;
  dailyProgress: DailyProgress;
}

export default function JourneyBoard() {
  const { user } = useUser();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<RoadmapData>({
    queryKey: ["/api/roadmap"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-destructive">
        <p>Error loading journey board. Please try again.</p>
      </div>
    );
  }

  if (!data || !data.milestones.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <p>No milestones available.</p>
      </div>
    );
  }

  const { milestones, userMilestones, currentMilestoneId, dailyProgress } = data;

  const handleMilestoneClick = (milestone: Milestone) => {
    const isCurrent = milestone.id === currentMilestoneId;
    const isCompleted = userMilestones.some(
      (um) => um.milestoneId === milestone.id && um.completed
    );

    if (isCompleted) {
      toast({
        title: "Milestone completed",
        description: "You've already completed this milestone",
      });
      return;
    }

    if (!isCurrent) {
      toast({
        title: "Not available",
        description: "Complete previous milestones first",
      });
      return;
    }

    if (!dailyProgress.canComplete) {
      toast({
        title: "Daily limit reached",
        description: "You can complete up to 5 steps per day (4 tasks + 1 boss battle)",
      });
      return;
    }

    if (milestone.type === "boss_battle" && dailyProgress.completedBossBattleToday) {
      toast({
        title: "Boss battle limit reached",
        description: "You can only complete one boss battle per day",
      });
      return;
    }

    if (milestone.type === "task" && dailyProgress.completedToday >= 4) {
      toast({
        title: "Task limit reached",
        description: "You can only complete 4 tasks per day",
      });
      return;
    }

    setSelectedMilestone(milestone);
  };

  const visibleMilestones = milestones.slice(0, 10);

  return (
    <div className="w-full h-full p-4">
      <div className="grid grid-cols-5 gap-4 h-full">
        {visibleMilestones.map((milestone, index) => {
          const userMilestone = userMilestones.find(
            (um) => um.milestoneId === milestone.id
          );
          const isCurrent = milestone.id === currentMilestoneId;
          const isCompleted = userMilestone?.completed;
          const isLocked = !isCompleted && !isCurrent;
          const isBossBattle = milestone.type === "boss_battle";
          const canStart = isCurrent && !isCompleted;

          return (
            <motion.div
              key={milestone.id}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-lg border-2 transition-colors h-[180px]",
                isCurrent && "border-primary bg-primary/20 shadow-lg shadow-primary/20",
                !isCurrent && "border-primary/20 bg-black",
                isCompleted && "opacity-50",
                isLocked && "cursor-not-allowed",
                isBossBattle && "border-yellow-500"
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="absolute -top-2 -left-2">
                {isBossBattle ? (
                  <Trophy className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Target className="w-4 h-4 text-primary" />
                )}
              </div>

              {isLocked && (
                <div className="absolute -top-2 -right-2">
                  <Lock className="w-4 h-4 text-primary/50" />
                </div>
              )}

              <div className="flex-1 w-full text-center">
                <h3 className="text-sm font-medium text-primary/80 mt-2 line-clamp-2">
                  {milestone.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {milestone.estimatedDuration}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {milestone.xpReward} XP • {milestone.coinReward} 🪙
                </div>
              </div>

              {canStart && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleMilestoneClick(milestone)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedMilestone && (
        <MilestoneCompletion
          milestone={selectedMilestone}
          isOpen={true}
          onClose={() => setSelectedMilestone(null)}
        />
      )}
    </div>
  );
}