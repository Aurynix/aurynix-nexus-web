"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useAuthLanguage } from "@/lib/i18n/auth-language";
import { translateError } from "@/lib/i18n/auth-messages";
import { describeAuthError } from "@/lib/i18n/auth-errors";
import { AuthPreferences } from "@/components/auth/AuthPreferences";
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
  email: z.string().email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const { language, dir, t } = useAuthLanguage();
  // The failure itself, not its text, so switching language re-translates it.
  const [serverError, setServerError] = useState<unknown>(null);

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
      setServerError(err ?? new Error("Request failed"));
    }
  };

  return (
    <div
      dir={dir}
      lang={language}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background p-5"
    >
      <AuthPreferences />
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
            <CardTitle className="text-[21px] tracking-[-0.02em]">{t.signInTitle}</CardTitle>
            <CardDescription>
              {t.signInDescription}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError != null && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {describeAuthError(t, serverError, "signin")}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {translateError(t, errors.email.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <PasswordInput
                  showLabel={t.showPassword}
                  hideLabel={t.hidePassword}
                  id="password"
                  dir="ltr"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {translateError(t, errors.password.message)}
                  </p>
                )}
              </div>

              <AuthDivider label={t.or} />
              <GoogleButton mode="signin" disabled={isSubmitting} />

              <Button
                type="submit"
                className="aury-btn-primary h-11.5 w-full text-[15px] font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.signInSubmitting : t.signInSubmit}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pt-1">
            <p className="text-[13.5px] text-muted-foreground">
              {t.noAccount}{" "}
              <Link
                href="/register"
                className="ms-0.5 font-bold text-brand-text hover:brightness-115"
              >
                {t.signUpLink}
              </Link>
            </p>
          </CardFooter>
        </Card>
        </div>

        <p className="mt-5.5 text-center text-xs text-muted-foreground/70">
          {t.footer}
        </p>
      </div>
    </div>
  );
}
