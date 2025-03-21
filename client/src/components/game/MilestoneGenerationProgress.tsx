import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  isGenerating: boolean;
}

export default function MilestoneGenerationProgress({ isGenerating }: Props) {
  if (!isGenerating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-12 w-12 text-primary mb-4" />
      </motion.div>
      
      <h3 className="text-xl font-bold text-primary mb-4">
        Generating Your Daily Milestones
      </h3>
      
      <div className="w-64 space-y-2">
        <Progress value={100} className="animate-progress" />
        <p className="text-sm text-gray-400 text-center">
          Personalizing challenges based on your journey...
        </p>
      </div>
    </motion.div>
  );
}
