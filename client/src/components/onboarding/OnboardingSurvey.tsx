/**
 * OnboardingSurvey Component
 * 
 * A comprehensive onboarding flow that collects essential user information to personalize
 * their entrepreneurial journey. This multi-step form gathers data about the user's
 * business, experience, goals, and skill levels.
 * 
 * @component
 * 
 * Features:
 * - Multi-step form with smooth transitions
 * - Real-time validation
 * - Animated UI elements
 * - Progress tracking
 * - Skill self-assessment
 * 
 * Dependencies:
 * - react-hook-form for form management
 * - @tanstack/react-query for data mutations
 * - framer-motion for animations
 * - shadcn/ui components
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { businessIndustries, businessStages, entrepreneurExperienceLevels, skillCategories } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type OnboardingStep = 'business' | 'experience' | 'goals' | 'skills' | 'complete';

interface OnboardingData {
  businessName?: string;
  businessIndustry: string;
  businessStage: string;
  entrepreneurExperience: string;
  primaryGoals: string;
  skillLevels: Record<string, number>;
}

export default function OnboardingSurvey() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business');
  const { user } = useUser();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<OnboardingData>({
    defaultValues: {
      businessName: "",
      businessIndustry: "",
      businessStage: "",
      entrepreneurExperience: "",
      primaryGoals: "",
      skillLevels: Object.keys(skillCategories).reduce((acc, key) => ({ ...acc, [key]: 1 }), {}),
    },
  });

  const { mutate: submitOnboarding, isPending } = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          primaryGoals: [data.primaryGoals], // Convert to array format for backend
        }),
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
        title: "Welcome aboard!",
        description: "Your entrepreneurial journey begins now.",
      });
      setCurrentStep('complete');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateCurrentStep = (): boolean => {
    const values = form.getValues();
    switch (currentStep) {
      case 'business':
        return !!values.businessIndustry && !!values.businessStage;
      case 'experience':
        return !!values.entrepreneurExperience;
      case 'goals':
        return values.primaryGoals.length >= 10; // Ensure they write at least a short paragraph
      case 'skills':
        return Object.keys(values.skillLevels).length === Object.keys(skillCategories).length;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Please complete all fields",
        description: currentStep === 'goals'
          ? "Please write at least a brief paragraph about your goals"
          : "All required fields must be completed before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const steps: OnboardingStep[] = ['business', 'experience', 'goals', 'skills', 'complete'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentStep === 'skills') {
      submitOnboarding(form.getValues());
    } else {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-black border-primary">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center">
              {currentStep === 'business' && "Tell us about your business"}
              {currentStep === 'experience' && "Your entrepreneurial background"}
              {currentStep === 'goals' && "What are your goals?"}
              {currentStep === 'skills' && "Assess your skills"}
              {currentStep === 'complete' && "Welcome to your journey!"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {currentStep === 'business' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-primary">Business Name (Optional)</Label>
                      <Input
                        id="businessName"
                        {...form.register("businessName")}
                        className="bg-black border-primary text-white"
                        placeholder="Your business name or idea (you can add this later)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary">Industry</Label>
                      <RadioGroup
                        onValueChange={(value) => form.setValue("businessIndustry", value)}
                        className="grid grid-cols-2 gap-4"
                      >
                        {Object.entries(businessIndustries).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <RadioGroupItem value={key} id={`industry-${key}`} />
                            <Label htmlFor={`industry-${key}`} className="text-gray-300">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary">Business Stage</Label>
                      <RadioGroup
                        onValueChange={(value) => form.setValue("businessStage", value)}
                        className="grid grid-cols-2 gap-4"
                      >
                        {Object.entries(businessStages).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <RadioGroupItem value={key} id={`stage-${key}`} />
                            <Label htmlFor={`stage-${key}`} className="text-gray-300">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {currentStep === 'experience' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-primary">Your Experience Level</Label>
                      <RadioGroup
                        onValueChange={(value) => form.setValue("entrepreneurExperience", value)}
                        className="space-y-4"
                      >
                        {Object.entries(entrepreneurExperienceLevels).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <RadioGroupItem value={key} id={`experience-${key}`} />
                            <Label htmlFor={`experience-${key}`} className="text-gray-300">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {currentStep === 'goals' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-primary">Tell us about your entrepreneurial goals</Label>
                      <div className="text-gray-400 mb-2">
                        What do you hope to achieve? What impact do you want to make? What kind of business do you want to build?
                      </div>
                      <Textarea
                        {...form.register("primaryGoals")}
                        className="h-48 bg-black border-primary text-white"
                        placeholder="Write about your entrepreneurial goals and aspirations..."
                      />
                    </div>
                  </div>
                )}

                {currentStep === 'skills' && (
                  <div className="space-y-6">
                    {Object.entries(skillCategories).map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-primary">{label}</Label>
                        <Slider
                          defaultValue={[form.getValues("skillLevels")[key] || 1]}
                          max={5}
                          step={1}
                          onValueChange={([value]) => {
                            const skillLevels = form.getValues("skillLevels");
                            form.setValue("skillLevels", {
                              ...skillLevels,
                              [key]: value,
                            });
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Beginner</span>
                          <span>Expert</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 'complete' && (
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">You're all set!</h3>
                    <p className="text-gray-400">
                      Welcome to your entrepreneurial journey. Redirecting to your dashboard...
                    </p>
                  </div>
                )}

                {currentStep !== 'complete' && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleNext}
                      disabled={isPending}
                      className="w-full bg-primary text-black hover:bg-primary/90"
                    >
                      {currentStep === 'skills' ? (
                        isPending ? (
                          "Saving..."
                        ) : (
                          "Complete Onboarding"
                        )
                      ) : (
                        <>
                          Next Step
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}