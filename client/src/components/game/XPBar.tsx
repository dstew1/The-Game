import { Progress } from "@/components/ui/progress";
import { calculateLevel, getLevelProgress } from "@db/schema";

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  const { currentLevel, currentLevelXp, nextLevelXp, progress } = getLevelProgress(xp);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-400">
        <span>{currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
        <span>Level {currentLevel}</span>
      </div>
      <Progress value={progress} className="bg-black border border-primary" />
    </div>
  );
}