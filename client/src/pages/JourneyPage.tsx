import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { fadeInScale } from "@/lib/animations";
import JourneyBoard from "@/components/game/JourneyBoard";
import { useQuery } from "@tanstack/react-query";

export default function JourneyPage() {
  const { data: roadmapData } = useQuery({
    queryKey: ["/api/roadmap"],
  });

  const dailyProgress = roadmapData?.dailyProgress;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back navigation */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="p-2 text-primary hover:bg-primary/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Entrepreneurial Journey</h1>
        </div>

        {/* Main game board container */}
        <motion.div
          variants={fadeInScale}
          initial="initial"
          animate="animate"
          className="w-full aspect-square max-h-[800px] relative"
        >
          <Card className="w-full h-full bg-black border-primary">
            <CardHeader>
              <CardTitle className="text-primary text-center">Your Path to Success</CardTitle>
            </CardHeader>
            <CardContent className="relative h-[calc(100%-5rem)]">
              <JourneyBoard />
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily progress indicator */}
        <Card className="bg-black border-primary">
          <CardHeader>
            <CardTitle className="text-primary text-sm">Daily Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                Tasks Completed: {dailyProgress ? `${dailyProgress.completedToday}/4` : '0/4'}
              </span>
              <span className="text-gray-400">
                {dailyProgress?.completedBossBattleToday ? 'Boss Battle Completed' : 'Boss Battle Available'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}