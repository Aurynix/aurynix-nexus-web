"use client";

import { AlertCircle } from "lucide-react";

interface InterruptBannerProps {
  question: string;
}

export function InterruptBanner({ question }: InterruptBannerProps) {
  return (
    <div className="mx-4 my-2 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">Waiting for confirmation</p>
        <p className="text-sm text-muted-foreground mt-0.5">{question}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Reply in the chat to continue.
        </p>
      </div>
    </div>
  );
}
