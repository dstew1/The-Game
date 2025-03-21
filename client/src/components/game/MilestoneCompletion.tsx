import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MilestoneCompletionProps {
  milestone: {
    id: number;
    title: string;
    description: string;
    type: "task" | "boss_battle";
    requirements: any;
    xpReward: number;
    coinReward: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function MilestoneCompletion({
  milestone,
  isOpen,
  onClose,
}: MilestoneCompletionProps) {
  const [reflection, setReflection] = useState("");
  const [data, setData] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/roadmap/milestones/${milestone.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reflection,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });

      // Show different toast based on milestone type and rewards
      if (milestone.type === "boss_battle" && data.rewards) {
        const { type, name, rarity } = data.rewards;
        const rarityColors = {
          common: "text-gray-400",
          rare: "text-blue-400",
          epic: "text-purple-400",
          legendary: "text-yellow-400"
        };

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Boss Battle Complete!
            </div>
          ),
          description: (
            <div className="space-y-2">
              <p>You've earned:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{milestone.xpReward} XP</li>
                <li>{milestone.coinReward} DreamCoins</li>
                <li className={`flex items-center gap-1 ${rarityColors[rarity]}`}>
                  <Sparkles className="h-4 w-4" />
                  {rarity} {name}
                </li>
              </ul>
            </div>
          ),
        });
      } else {
        toast({
          title: "Milestone Completed!",
          description: `You've earned ${milestone.xpReward} XP and ${milestone.coinReward} DreamCoins`,
        });
      }

      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Please add a reflection",
        description: "Share what you learned or accomplished in this milestone",
        variant: "destructive",
      });
      return;
    }

    const requiredFields = milestone.requirements?.fields || [];
    const missingFields = requiredFields.filter(
      (field: string) => !data[field]?.trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    completeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {milestone.type === "boss_battle" && <Crown className="h-5 w-5 text-primary" />}
            {milestone.title}
          </DialogTitle>
          <DialogDescription>{milestone.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Your Reflection
            </label>
            <Textarea
              placeholder="Share what you learned or accomplished..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="h-32"
            />
          </div>

          {milestone.requirements?.fields?.map((field: string) => (
            <div key={field} className="grid gap-2">
              <label className="text-sm font-medium">
                {field.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <Input
                value={data[field] || ""}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder={`Enter your ${field.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Milestone"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}