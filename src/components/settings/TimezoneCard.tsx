"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTimezone } from "@/hooks/useTimezone";
import { browserTimezone, supportedTimezones } from "@/lib/timezone";

/**
 * The timezone the agent resolves "Wednesday at 3pm" against. It lives beside
 * the Google card because it is the other half of getting a meeting into the
 * right slot — and it is the thing to check first when one lands an hour off.
 */
export function TimezoneCard() {
  const { timezone, source, storedValue, isLoading, isSaving, save } =
    useTimezone();

  // `null` means untouched, so the stored value flows straight through once it
  // loads instead of being frozen by an effect that copies it into state.
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selection = draft ?? timezone;
  const setSelection = setDraft;

  const zones = supportedTimezones();
  const detected = browserTimezone();
  const options = zones.includes(selection) ? zones : [selection, ...zones];
  const isDirty = selection !== timezone;

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      await save(selection);
      setDraft(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save your timezone."
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-soft text-brand-text">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Timezone</CardTitle>
              {!isLoading && source === "fallback" && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                >
                  Not set — using UTC
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Relative times like &ldquo;Wednesday at 3pm&rdquo; are booked in
              this zone.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {storedValue && source === "fallback" && (
              <p className="text-sm text-destructive">
                Stored value &ldquo;{storedValue}&rdquo; isn&rsquo;t a timezone
                this browser recognises, so times fall back to UTC.
              </p>
            )}

            <select
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
              aria-label="Timezone"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {options.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>

            {detected !== selection && (
              <p className="text-[13px] text-muted-foreground">
                This device says {detected}.{" "}
                <button
                  type="button"
                  onClick={() => setSelection(detected)}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Use it
                </button>
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? "Saving…" : "Save timezone"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
