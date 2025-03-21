import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb, Target, Trophy } from "lucide-react";
import { mentorPersonalities, type MentorPersonality } from "@db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

const personalityIcons = {
  balanced: Brain,
  motivational: Trophy,
  analytical: Lightbulb,
  challenger: Target,
} as const;

interface MentorPersonalitySelectorProps {
  currentPersonality: MentorPersonality;
}

export default function MentorPersonalitySelector({ 
  currentPersonality 
}: MentorPersonalitySelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updatePersonality, isPending } = useMutation({
    mutationFn: async (personality: MentorPersonality) => {
      const response = await fetch("/api/user/mentor-personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personality }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Mentor Personality Updated",
        description: "Your AI mentor's personality has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePersonalityChange = (value: MentorPersonality) => {
    if (!isPending) {
      updatePersonality(value);
    }
  };

  return (
    <Card className="bg-black border-primary">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Mentor Personality
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          disabled={isPending}
          value={currentPersonality}
          onValueChange={handlePersonalityChange}
        >
          <SelectTrigger className="bg-black border-primary text-white w-full">
            <div className="flex items-center gap-2 truncate">
              {currentPersonality && (
                <>
                  {React.createElement(personalityIcons[currentPersonality], {
                    className: "h-4 w-4 text-primary shrink-0"
                  })}
                  <span className="truncate">
                    {mentorPersonalities[currentPersonality].name}
                  </span>
                </>
              )}
            </div>
          </SelectTrigger>
          <SelectContent 
            className="bg-black border-primary max-h-[300px] overflow-y-auto p-2"
            align="start"
            sideOffset={4}
          >
            {Object.entries(mentorPersonalities).map(([key, { name, description }]) => {
              const Icon = personalityIcons[key as MentorPersonality];
              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-md py-2 px-3 my-1"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-none mb-1">{name}</p>
                      <p className="text-sm text-gray-400 break-words leading-snug">{description}</p>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}