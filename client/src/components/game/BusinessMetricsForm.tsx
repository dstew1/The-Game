import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BusinessMetrics } from "@/pages/RoadmapPage";

const businessMetricsSchema = z.object({
  businessName: z.string().min(1, "Please enter your business name"),
  industry: z.string().min(1, "Please enter your industry"),
  monthlyRevenue: z.string().min(1, "Please enter your current monthly revenue"),
  shortTermGoals: z.string().min(10, "Please describe your short-term business goals"),
  challenges: z.string().min(10, "Please describe your current challenges"),
});

interface BusinessMetricsFormProps {
  onSubmit: (data: BusinessMetrics) => void;
  defaultValues?: Partial<BusinessMetrics>;
}

export default function BusinessMetricsForm({ onSubmit, defaultValues }: BusinessMetricsFormProps) {
  const form = useForm<BusinessMetrics>({
    resolver: zodResolver(businessMetricsSchema),
    defaultValues: defaultValues || {
      businessName: "",
      industry: "",
      monthlyRevenue: "",
      shortTermGoals: "",
      challenges: "",
    },
  });

  return (
    <Card className="w-full max-w-xl mx-auto bg-black border-primary">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Business Profile Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-primary">Business Name</label>
            <Input
              type="text"
              placeholder="e.g. TechInnovate Solutions"
              {...form.register("businessName")}
              className="bg-black border-primary text-white"
            />
            {form.formState.errors.businessName && (
              <p className="text-sm text-red-500">{form.formState.errors.businessName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-primary">Industry</label>
            <Input
              type="text"
              placeholder="e.g. Technology, E-commerce, Healthcare"
              {...form.register("industry")}
              className="bg-black border-primary text-white"
            />
            {form.formState.errors.industry && (
              <p className="text-sm text-red-500">{form.formState.errors.industry.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-primary">Monthly Revenue</label>
            <Input
              type="text"
              placeholder="e.g. $5000"
              {...form.register("monthlyRevenue")}
              className="bg-black border-primary text-white"
            />
            {form.formState.errors.monthlyRevenue && (
              <p className="text-sm text-red-500">{form.formState.errors.monthlyRevenue.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-primary">Short-term Business Goals</label>
            <Textarea
              placeholder="What are your main business goals for the next 3-6 months?"
              {...form.register("shortTermGoals")}
              className="bg-black border-primary text-white min-h-[80px]"
            />
            {form.formState.errors.shortTermGoals && (
              <p className="text-sm text-red-500">{form.formState.errors.shortTermGoals.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-primary">Current Challenges</label>
            <Textarea
              placeholder="What challenges are you currently facing?"
              {...form.register("challenges")}
              className="bg-black border-primary text-white min-h-[80px]"
            />
            {form.formState.errors.challenges && (
              <p className="text-sm text-red-500">{form.formState.errors.challenges.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-black hover:bg-primary/90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Updating..." : "Generate Personalized Milestones"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}