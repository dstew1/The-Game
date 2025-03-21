/**
 * AuthPage Component
 * 
 * Handles user authentication and registration with a dynamic form that switches
 * between login and registration modes. Provides form validation and error handling.
 * 
 * @component
 * 
 * Features:
 * - Dynamic form switching between login and register modes
 * - Real-time form validation
 * - Error messaging
 * - Animated transitions
 * - Password security checks
 * - Legal agreement links
 * 
 * Dependencies:
 * - react-hook-form for form management
 * - @tanstack/react-query for API mutations
 * - zod for schema validation
 * - framer-motion for animations
 */

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { NewUser } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@db/schema";
import { motion } from "framer-motion";
import { fadeInScale } from "@/lib/animations";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().optional(),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register: registerUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const form = useForm<NewUser>({
    resolver: zodResolver(isLogin ? loginSchema : insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  const onSubmit = async (data: NewUser) => {
    try {
      const submitData = isLogin ? {
        username: data.username,
        password: data.password,
      } : data;

      const result = await (isLogin ? login(submitData) : registerUser(data));
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        if (!isLogin) {
          queryClient.invalidateQueries({ queryKey: ["/api/daily-challenges"] });
        }

        toast({
          title: isLogin ? "Welcome back!" : "Welcome aboard!",
          description: isLogin
            ? "Successfully logged in to your account."
            : "Your account has been created successfully.",
        });

        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div
        variants={fadeInScale}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.img
            src="/logo.png"
            alt="Brand Logo"
            className="w-32 h-32 object-contain"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          />
        </div>

        <Card className="bg-black border-primary">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center">
              {isLogin ? "Login" : "Register"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Username"
                  {...form.register("username")}
                  className="bg-black border-primary text-white"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.username.message}
                  </p>
                )}
                {!isLogin && (
                  <>
                    <Input
                      type="email"
                      placeholder="Email"
                      {...form.register("email")}
                      className="bg-black border-primary text-white"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </>
                )}
                <Input
                  type="password"
                  placeholder="Password"
                  {...form.register("password")}
                  className="bg-black border-primary text-white"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-primary/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="animate-pulse">
                      {isLogin ? "Logging in..." : "Creating account..."}
                    </span>
                  ) : (
                    isLogin ? "Login" : "Register"
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/90"
                  onClick={() => {
                    form.reset();
                    setIsLogin(!isLogin);
                  }}
                >
                  {isLogin ? "Need an account? Register" : "Have an account? Login"}
                </Button>
              </motion.div>
              {/* Legal links */}
              <div className="mt-4 text-center text-xs text-gray-400">
                <p>
                  By continuing, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}