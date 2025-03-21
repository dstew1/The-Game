import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Roadmap from "@/components/game/Roadmap";

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Your Journey Map</h1>
        </div>

        {/* Show roadmap */}
        <div className="h-[calc(100vh-8rem)]">
          <Roadmap />
        </div>
      </div>
    </div>
  );
}