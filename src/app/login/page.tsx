"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await signIn({ email: data.email, password: data.password });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Sign in failed. Please try again.");
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background p-5">
      <div className="aury-glow absolute -top-55 left-1/2 h-140 w-190 -translate-x-1/2" />
      <div className="relative w-full max-w-[420px] animate-aury-fade">
        {/* Logo */}
        <div className="mb-7 flex flex-col items-center gap-4">
          <div className="aury-mark h-13 w-13 rounded-[15px]" />
          <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-foreground">
            Aurynix Nexus
          </h1>
        </div>

        <div className="aury-gradient-border rounded-[20px]">
        <Card className="rounded-[19px] border-0 bg-[image:var(--surface-gradient)] p-2 shadow-none">
          <CardHeader className="space-y-1.5 pb-5">
            <CardTitle className="text-[21px] tracking-[-0.02em]">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <AuthDivider />
              <GoogleButton mode="signin" disabled={isSubmitting} />

              <Button
                type="submit"
                className="aury-btn-primary h-11.5 w-full text-[15px] font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pt-1">
            <p className="text-[13.5px] text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="ml-0.5 font-bold text-brand-text hover:brightness-115"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
        </div>

        <p className="mt-5.5 text-center text-xs text-muted-foreground/70">
          Protected by Aurynix identity · SOC 2 Type II
        </p>
      </div>
    </div>
  );
}
