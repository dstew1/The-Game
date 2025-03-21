/**
 * NetworkPage Component
 * 
 * A social hub page that displays leaderboards, achievements, and user interactions.
 * Features multiple tabs for different types of social content and competitive elements.
 * 
 * @component
 * 
 * Features:
 * - XP Leaderboard tracking user progress
 * - DreamCoin wealth rankings
 * - Win Board for sharing achievements
 * - Real-time updates
 * - Animated transitions between views
 * 
 * Dependencies:
 * - @tanstack/react-query for data fetching
 * - framer-motion for animations
 * - shadcn/ui components
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Coins, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInScale } from "@/lib/animations";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";

interface LeaderboardUser {
  id: number;
  username: string;
  level: number;
  xp: number;
  dreamcoins: number;
}

interface Win {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  coinReward: number;
  createdAt: string;
}

function PostWinForm() {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { mutate: postWin, isPending } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/wins"] });
      toast({
        title: "Win posted!",
        description: "Your achievement has been shared with the community.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter your win before posting",
        variant: "destructive",
      });
      return;
    }
    postWin(content);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your latest achievement! (e.g., 'Just completed my business plan!' or 'Landed my first client!')"
        className="mb-2 bg-black border-primary text-white"
      />
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-black hover:bg-primary/90"
      >
        {isPending ? "Posting..." : "Share Win"}
      </Button>
    </form>
  );
}

function XPLeaderboard() {
  const { data: users = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard/xp"],
    staleTime: 1000 * 30, // Cache for 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-primary/10 rounded-lg" />
          ))}
        </div>
      ) : (
        users.map((user, index) => (
          <motion.div
            key={user.id}
            variants={fadeInScale}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black ${
                      index < 3 ? "bg-primary" : "bg-primary/20"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-sm text-gray-400">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>{user.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}

function DreamCoinLeaderboard() {
  const { data: users = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard/dreamcoins"],
    staleTime: 1000 * 30, // Cache for 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-primary/10 rounded-lg" />
          ))}
        </div>
      ) : (
        users.map((user, index) => (
          <motion.div
            key={user.id}
            variants={fadeInScale}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-black ${
                      index < 3 ? "bg-primary" : "bg-primary/20"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-sm text-gray-400">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Coins className="h-4 w-4 text-primary" />
                    <span>{user.dreamcoins.toLocaleString()} DC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}

function WinBoard() {
  const { data: wins = [], isLoading } = useQuery<Win[]>({
    queryKey: ["/api/wins"],
  });

  return (
    <div className="space-y-4">
      <PostWinForm />

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-primary/10 rounded-lg" />
          ))}
        </div>
      ) : (
        wins.map((win, index) => (
          <motion.div
            key={win.id}
            variants={fadeInScale}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <p className="font-medium text-white">{win.username}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(win.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-300">{win.description}</p>
                  {(win.xpReward > 0 || win.coinReward > 0) && (
                    <div className="flex gap-4 text-sm text-gray-400 mt-2">
                      {win.xpReward > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          +{win.xpReward} XP
                        </div>
                      )}
                      {win.coinReward > 0 && (
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4" />
                          +{win.coinReward} DC
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  );
}

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState("xp");

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="p-2 text-primary hover:bg-primary/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Network</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 bg-black border border-primary">
            <TabsTrigger value="xp" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Trophy className="h-4 w-4 mr-2" />
              XP Leaders
            </TabsTrigger>
            <TabsTrigger value="dreamcoins" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Coins className="h-4 w-4 mr-2" />
              DreamCoin Rich
            </TabsTrigger>
            <TabsTrigger value="wins" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Star className="h-4 w-4 mr-2" />
              Win Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xp" className="space-y-4">
            <XPLeaderboard />
          </TabsContent>

          <TabsContent value="dreamcoins" className="space-y-4">
            <DreamCoinLeaderboard />
          </TabsContent>

          <TabsContent value="wins" className="space-y-4">
            <WinBoard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}