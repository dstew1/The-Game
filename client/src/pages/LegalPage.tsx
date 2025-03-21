/**
 * LegalPage Component
 * 
 * Displays legal information including Terms of Service and Privacy Policy.
 * The content dynamically changes based on the current route.
 * 
 * @component
 * 
 * Features:
 * - Dynamic content switching based on route
 * - Responsive layout
 * - Animated transitions
 * - Back navigation with history support
 * - Structured legal content sections
 * 
 * Dependencies:
 * - wouter for routing
 * - framer-motion for animations
 * - shadcn/ui components
 */

import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInScale } from "@/lib/animations";

export default function LegalPage() {
  const [location, setLocation] = useLocation();
  const isPrivacyPolicy = location === "/privacy-policy";

  const handleBack = () => {
    // Check if there's a previous page in the history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, redirect to auth or dashboard
      const hasUser = localStorage.getItem("user");
      setLocation(hasUser ? "/" : "/auth");
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-primary"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.div
          variants={fadeInScale}
          initial="initial"
          animate="animate"
        >
          <Card className="bg-black border-primary">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                {isPrivacyPolicy ? "Privacy Policy" : "Terms of Service"}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              {isPrivacyPolicy ? (
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xl font-semibold text-primary">1. Data Collection</h2>
                    <p>We collect the following information:</p>
                    <ul>
                      <li>Account information (username, email)</li>
                      <li>Game progress and achievements</li>
                      <li>Business metrics you provide</li>
                      <li>AI mentor interaction data</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">2. Data Usage</h2>
                    <p>Your data is used to:</p>
                    <ul>
                      <li>Provide and improve game features</li>
                      <li>Personalize your learning experience</li>
                      <li>Track your progress and achievements</li>
                      <li>Enhance AI mentor interactions</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">3. Data Protection</h2>
                    <p>We implement security measures to protect your data:</p>
                    <ul>
                      <li>Secure data encryption</li>
                      <li>Regular security audits</li>
                      <li>Limited staff access</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">4. User Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                      <li>Access your data</li>
                      <li>Request data deletion</li>
                      <li>Update your information</li>
                      <li>Opt-out of non-essential data collection</li>
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xl font-semibold text-primary">1. Account Rules</h2>
                    <ul>
                      <li>You must be at least 13 years old to use the service</li>
                      <li>Provide accurate information during registration</li>
                      <li>Maintain account security</li>
                      <li>One account per user</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">2. Acceptable Use</h2>
                    <p>You agree not to:</p>
                    <ul>
                      <li>Share inappropriate or harmful content</li>
                      <li>Attempt to manipulate game systems</li>
                      <li>Harass other users</li>
                      <li>Use automated systems or bots</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">3. Intellectual Property</h2>
                    <p>All game content, including:</p>
                    <ul>
                      <li>Graphics and visual elements</li>
                      <li>Game mechanics and systems</li>
                      <li>AI mentor interactions</li>
                      <li>User-generated content (subject to our usage rights)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-primary">4. Termination</h2>
                    <p>We reserve the right to:</p>
                    <ul>
                      <li>Suspend or terminate accounts for violations</li>
                      <li>Modify or discontinue services</li>
                      <li>Update these terms with notice</li>
                    </ul>
                  </section>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}