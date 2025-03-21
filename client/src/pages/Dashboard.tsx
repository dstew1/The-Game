import { useUser } from "@/hooks/use-user";
import XPBar from "@/components/game/XPBar";
import DailyChallenge from "@/components/game/DailyChallenge";
import DailyRewards from "@/components/game/DailyRewards";
import Avatar from "@/components/game/Avatar";
import ChatInterface from "@/components/game/ChatInterface";
import MentorPersonalitySelector from "@/components/game/MentorPersonalitySelector";
import MainNav from "@/components/navigation/MainNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Coins, LogOut, Trophy, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cardHoverVariants, buttonHoverVariants } from "@/lib/animations";
import { getLevelProgress } from "@db/schema";
import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useUser();
  const { currentLevel } = user ? getLevelProgress(user.xp) : { currentLevel: 1 };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-primary/20">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-primary">The Game</h1>

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-black border-primary w-[80%] max-w-sm">
                <div className="flex flex-col space-y-4 mt-8">
                  <MainNav orientation="vertical" onNavClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <MainNav orientation="horizontal" />
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <motion.div
              variants={buttonHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Button variant="ghost" onClick={handleLogout} className="text-primary">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Management Card */}
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              className="h-full"
            >
              <Card className="bg-black border-primary h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Profile Management</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] flex flex-col justify-center">
                  <div className="flex items-center space-x-4">
                    <Avatar />
                    <div>
                      <p className="text-primary font-bold">{user?.username}</p>
                      <p className="text-gray-400">Level {currentLevel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Level & Progress Card */}
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              className="h-full"
            >
              <Card className="bg-black border-primary h-full">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Level & Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] flex flex-col justify-center space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-3xl font-bold text-primary">Level {currentLevel}</h2>
                    <p className="text-gray-400">{user?.xp?.toLocaleString()} Total XP</p>
                  </div>
                  <XPBar xp={user?.xp || 0} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Wallet Card */}
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              className="h-full"
            >
              <Card className="bg-black border-primary h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Wallet</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-primary font-bold">{user?.dreamcoins?.toLocaleString() || 0} DreamCoins</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Daily Activities */}
            <div className="space-y-6">
              <DailyRewards />
              <DailyChallenge />
            </div>

            {/* Right Column: AI Mentor Chat and Personality */}
            <div className="space-y-6">
              <ChatInterface />
              <MentorPersonalitySelector 
                currentPersonality={user?.mentorPersonality || "balanced"} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}