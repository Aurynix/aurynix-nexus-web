"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthPreferences } from "@/components/auth/AuthPreferences";
import { useAuthLanguage } from "@/lib/i18n/auth-language";
import { describeAuthError } from "@/lib/i18n/auth-errors";
import { translateGoogleReason } from "@/lib/i18n/auth-messages";

/**
 * Landing point for Google sign-in. The backend redirects here after Google
 * hands it the authorization code, with either:
 *
 *   /auth/callback?code=<single-use code>
 *   /auth/callback?error=access_denied&reason=<detail>
 *
 * We exchange the code for a token pair and drop the user into the app. A
 * Google address with no account yet goes to sign-up rather than a dead end.
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell status="signingIn" />}>
      <GoogleCallback />
    </Suspense>
  );
}

function GoogleCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeGoogleSignIn } = useAuth();
  const { t } = useAuthLanguage();
  // The failure itself, not its text, so switching language re-translates it.
  const [exchangeError, setExchangeError] = useState<unknown>(null);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const reason = searchParams.get("reason");
  const needsAccount = oauthError !== null && reason === "no_account";
  // Derived during render — no effect needed to know the link itself is bad.
  const badLink = !needsAccount && (oauthError !== null || !code);

  // Replace, not push: Back should not return to a spent callback URL.
  useEffect(() => {
    if (needsAccount) router.replace("/register?from=google");
  }, [needsAccount, router]);

  // Codes are single-use, so guard against React's double-invoke in dev.
  const exchanged = useRef(false);

  useEffect(() => {
    if (needsAccount || badLink || !code || exchanged.current) return;
    exchanged.current = true;

    completeGoogleSignIn(code).catch((err: unknown) => {
      setExchangeError(err ?? new Error("Google sign-in failed"));
    });
  }, [code, needsAccount, badLink, completeGoogleSignIn]);

  const error = badLink
    ? oauthError
      ? (translateGoogleReason(t, reason) ?? t.callbackCancelled)
      : t.callbackMissingCode
    : exchangeError
      ? describeAuthError(t, exchangeError, "google")
      : null;

  if (error) {
    return (
      <CallbackShell status="failed">
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {error}
        </p>
        <Link
          href="/login"
          className="aury-btn-soft mt-5 inline-flex h-9.5 items-center rounded-lg px-4 text-[13.5px] font-semibold"
        >
          {t.callbackBack}
        </Link>
      </CallbackShell>
    );
  }

  return <CallbackShell status={needsAccount ? "toSignUp" : "signingIn"} />;
}

function CallbackShell({
  status,
  children,
}: {
  status: "signingIn" | "toSignUp" | "failed";
  children?: React.ReactNode;
}) {
  const { language, dir, t } = useAuthLanguage();
  const tone = status === "failed" ? "error" : "pending";
  const title =
    status === "failed"
      ? t.callbackFailed
      : status === "toSignUp"
        ? t.callbackToSignUp
        : t.callbackSigningIn;

  return (
    <div
      dir={dir}
      lang={language}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5"
    >
      <AuthPreferences />
      <div className="aury-glow absolute -top-55 left-1/2 h-140 w-190 -translate-x-1/2" />
      <div className="relative flex animate-aury-fade flex-col items-center text-center">
        <div
          className={
            tone === "error"
              ? "flex h-14 w-14 items-center justify-center rounded-[18px] border border-destructive/30 bg-destructive/10 text-xl text-destructive"
              : "aury-mark animate-aury-pulse h-14 w-14 rounded-[18px]"
          }
        >
          {tone === "error" ? "!" : null}
        </div>
        <h1 className="mt-4.5 text-[21px] font-extrabold tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <div className="max-w-80">{children}</div>
      </div>
    </div>
  );
}
