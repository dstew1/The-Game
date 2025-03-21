import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Star, Backpack, User, Image, ArrowLeft, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLevelProgress } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

type InventoryItem = {
  id: number;
  userId: number;
  acquiredAt: string;
  source: string;
  equipped: boolean;
  item: {
    id: number;
    name: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    category: string;
  };
};

// Business metrics form schema
const businessMetricsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  monthlyRevenue: z.string().transform(val => parseInt(val || "0")),
  customerCount: z.string().transform(val => parseInt(val || "0")),
  socialFollowers: z.string().transform(val => parseInt(val || "0")),
  employeeCount: z.string().transform(val => parseInt(val || "0")),
  websiteVisitors: z.string().transform(val => parseInt(val || "0")),
});

type BusinessMetricsFormData = z.infer<typeof businessMetricsSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Get the latest user data from the cache
  const userData = queryClient.getQueryData(["/api/user"]);
  const avatarUrl = userData?.avatarUrl || user?.avatarUrl;

  // Use new level progress calculation
  const { currentLevel, currentLevelXp, nextLevelXp, progress } = user
    ? getLevelProgress(user.xp)
    : { currentLevel: 1, currentLevelXp: 0, nextLevelXp: 1000, progress: 0 };

  // Fetch business metrics
  const { data: businessMetrics } = useQuery({
    queryKey: ["/api/business-metrics"],
  });

  const businessMetricsForm = useForm<BusinessMetricsFormData>({
    resolver: zodResolver(businessMetricsSchema),
    defaultValues: {
      businessName: businessMetrics?.businessName || "",
      monthlyRevenue: businessMetrics?.monthlyRevenue?.toString() || "0",
      customerCount: businessMetrics?.customerCount?.toString() || "0",
      socialFollowers: businessMetrics?.socialFollowers?.toString() || "0",
      employeeCount: businessMetrics?.employeeCount?.toString() || "0",
      websiteVisitors: businessMetrics?.websiteVisitors?.toString() || "0",
    },
  });

  // Update business metrics mutation
  const { mutate: updateBusinessMetrics } = useMutation({
    mutationFn: async (data: BusinessMetricsFormData) => {
      const response = await fetch("/api/business-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-metrics"] });
      toast({
        title: "Business metrics updated",
        description: "Your business information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { mutate: uploadAvatar, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        avatarUrl: data.avatarUrl,
      }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG and GIF files are allowed",
        variant: "destructive",
      });
      return;
    }

    uploadAvatar(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/">
          <motion.div
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="ghost" className="text-primary hover:text-primary/80 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </motion.div>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-black/20">
          {[
            { value: "profile", icon: User, label: "Profile" },
            { value: "stats", icon: Star, label: "Stats" },
            { value: "inventory", icon: Backpack, label: "Inventory" }
          ].map(({ value, icon: Icon, label }) => (
            <motion.div
              key={value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TabsTrigger
                value={value}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-black text-primary w-full"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            </motion.div>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="profile" className="space-y-4">
              <Card className="bg-black border-primary">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    Profile Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAvatarClick} style={{cursor: "pointer"}}>
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={avatarUrl} 
                          className="object-cover"
                        />
                        <AvatarFallback className="text-primary">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleAvatarChange}
                    />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 border-primary text-primary hover:bg-primary/20"
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                      >
                        <Image className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Change Avatar"}
                      </Button>
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-1">Username</h3>
                    <p className="text-gray-400">{user?.username}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-1">Email</h3>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Business Management Card */}
              <Card className="bg-black border-primary">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Track and update your business metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...businessMetricsForm}>
                    <form onSubmit={businessMetricsForm.handleSubmit(updateBusinessMetrics)} className="space-y-4">
                      <FormField
                        control={businessMetricsForm.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary">Business Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-black border-primary text-white"
                                placeholder="Enter your business name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={businessMetricsForm.control}
                          name="monthlyRevenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">Monthly Revenue ($)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  className="bg-black border-primary text-white"
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessMetricsForm.control}
                          name="customerCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">Customer Count</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  className="bg-black border-primary text-white"
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessMetricsForm.control}
                          name="socialFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">Social Media Followers</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  className="bg-black border-primary text-white"
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessMetricsForm.control}
                          name="employeeCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">Number of Employees</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  className="bg-black border-primary text-white"
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessMetricsForm.control}
                          name="websiteVisitors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">Monthly Website Visitors</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  className="bg-black border-primary text-white"
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-primary text-black hover:bg-primary/90"
                      >
                        Update Business Metrics
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card className="bg-black border-primary">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    Level & Progress
                  </CardTitle>
                  <CardDescription className="text-gray-400">Track your entrepreneurial journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.h3
                        className="text-2xl font-bold text-primary"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        Level {currentLevel}
                      </motion.h3>
                      <p className="text-gray-400">
                        {user?.xp?.toLocaleString()} XP total
                      </p>
                    </div>
                    <motion.div
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-primary">{user?.dreamcoins?.toLocaleString()}</span>
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Progress to Level {currentLevel + 1}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <Progress value={progress} className="h-2 bg-primary/20" />
                    </motion.div>
                    <div className="text-center text-gray-400">
                      {currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Card className="bg-black border-primary">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    Your Items
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Items earned through achievements and boss battles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inventoryItems.map((userItem, index) => (
                        <motion.div
                          key={userItem.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card className="bg-black/50 border-primary/50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h4 className="font-medium text-primary">{userItem.item.name}</h4>
                                    <p className="text-gray-400 capitalize">
                                      {userItem.item.category.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                      {userItem.item.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Source: {userItem.source}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Acquired: {new Date(userItem.acquiredAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    userItem.item.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                                      userItem.item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                                        userItem.item.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                                          'bg-gray-500/20 text-gray-500'
                                  } capitalize`}>
                                    {userItem.item.rarity}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}