"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { describeOAuthReason } from "@/lib/oauth-errors";

/**
 * Landing point for Google sign-in. The backend redirects here after Google
 * hands it the authorization code, with either:
 *
 *   /auth/callback?code=<single-use code>
 *   /auth/callback?error=access_denied&reason=<detail>
 *
 * We exchange the code for a token pair and drop the user into the app.
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell title="Signing you in…" />}>
      <GoogleCallback />
    </Suspense>
  );
}

function GoogleCallback() {
  const searchParams = useSearchParams();
  const { completeGoogleSignIn } = useAuth();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const reason = searchParams.get("reason");

  // Derived during render — no effect needed to know the link itself is bad.
  const linkError = oauthError
    ? (describeOAuthReason(reason) ??
      "Google sign-in was cancelled or denied.")
    : !code
      ? "That sign-in link is missing its authorization code."
      : null;

  // Codes are single-use, so guard against React's double-invoke in dev.
  const exchanged = useRef(false);

  useEffect(() => {
    if (linkError || !code || exchanged.current) return;
    exchanged.current = true;

    completeGoogleSignIn(code).catch((err: unknown) => {
      setExchangeError(
        err instanceof Error
          ? err.message
          : "Could not complete Google sign-in."
      );
    });
  }, [code, linkError, completeGoogleSignIn]);

  const error = linkError ?? exchangeError;

  if (error) {
    return (
      <CallbackShell title="Sign-in failed" tone="error">
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {error}
        </p>
        <Link
          href="/login"
          className="aury-btn-soft mt-5 inline-flex h-9.5 items-center rounded-lg px-4 text-[13.5px] font-semibold"
        >
          Back to sign in
        </Link>
      </CallbackShell>
    );
  }

  return <CallbackShell title="Signing you in…" />;
}

function CallbackShell({
  title,
  tone = "pending",
  children,
}: {
  title: string;
  tone?: "pending" | "error";
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5">
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
