"use client";

import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Check,
  Loader2,
  Mail,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEventTime } from "@/lib/timezone";
import type {
  ApprovalChoice,
  CalendarApproval,
  EmailApproval,
  GenericApproval,
  PendingAction,
} from "@/types/approval";

export type ApprovalStatus = "idle" | "submitting" | "failed";

interface ApprovalCardProps {
  action: PendingAction;
  /** The zone the backend resolved relative times against. */
  timezone: string;
  /** True when no timezone is stored and the agent is defaulting to UTC. */
  timezoneIsFallback?: boolean;
  status: ApprovalStatus;
  error?: string | null;
  onDecide: (choice: Exclude<ApprovalChoice, "replied">) => void;
  onRetry?: () => void;
}

/**
 * An inline, non-blocking card for a write the agent has paused on. It sits in
 * the conversation flow — the user can keep scrolling and reading context, or
 * ignore the buttons entirely and type a reply, which the backend treats as a
 * rejection.
 */
export function ApprovalCard({
  action,
  timezone,
  timezoneIsFallback,
  status,
  error,
  onDecide,
  onRetry,
}: ApprovalCardProps) {
  const { Icon, heading, confirmLabel } = describe(action);
  const busy = status === "submitting";

  return (
    <div className="mx-4 my-3 overflow-hidden rounded-[14px] border border-amber-500/40 bg-amber-500/[0.07] shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
        <Icon className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-[13px] font-bold text-foreground">{heading}</p>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-amber-700/80 dark:text-amber-400/80">
          Needs approval
        </span>
      </div>

      <div className="px-4 py-3.5">
        {action.kind === "email" ? (
          <EmailDetails action={action} />
        ) : action.kind === "calendar" ? (
          <CalendarDetails
            action={action}
            timezone={timezone}
            timezoneIsFallback={timezoneIsFallback}
          />
        ) : (
          <GenericDetails action={action} />
        )}

        {status === "failed" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            <p className="min-w-0 flex-1 text-[13px] text-destructive">
              {error ?? "Couldn't send your decision."}
            </p>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-8 gap-1.5 text-[13px]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onDecide("approved")}
            disabled={busy}
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {confirmLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecide("cancelled")}
            disabled={busy}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <span className="text-xs text-muted-foreground">
            or reply below to change it
          </span>
        </div>
      </div>
    </div>
  );
}

function describe(action: PendingAction) {
  if (action.kind === "email") {
    return {
      Icon: Mail,
      heading:
        action.operation === "reply" ? "Send this reply?" : "Send this email?",
      confirmLabel: "Send",
    };
  }
  if (action.kind === "calendar") {
    if (action.operation === "delete") {
      return {
        Icon: CalendarX,
        heading: "Delete this event?",
        confirmLabel: "Confirm",
      };
    }
    return {
      Icon: action.operation === "update" ? CalendarClock : CalendarPlus,
      heading:
        action.operation === "update"
          ? "Update this event?"
          : "Add this to your calendar?",
      confirmLabel: "Confirm",
    };
  }
  return {
    Icon: AlertCircle,
    heading: "Waiting for your approval",
    confirmLabel: "Approve",
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 text-[13px]">
      <span className="w-14 flex-shrink-0 font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-foreground">
        {children}
      </span>
    </div>
  );
}

function EmailDetails({ action }: { action: EmailApproval }) {
  return (
    <div className="space-y-1.5">
      <Field label="To">
        {action.to.length ? action.to.join(", ") : "—"}
      </Field>
      {action.cc.length > 0 && <Field label="Cc">{action.cc.join(", ")}</Field>}
      {action.bcc.length > 0 && (
        <Field label="Bcc">{action.bcc.join(", ")}</Field>
      )}
      <Field label="Subject">{action.subject ?? "(no subject)"}</Field>

      <div className="mt-2.5 rounded-[10px] border border-border bg-background/70 px-3 py-2.5">
        {action.body ? (
          // Plain text: line breaks are the author's, so preserve them verbatim
          // rather than rendering markdown the recipient would never see.
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">
            {action.body}
          </p>
        ) : (
          <p className="text-[13px] italic text-muted-foreground">
            (empty message)
          </p>
        )}
      </div>
    </div>
  );
}

function CalendarDetails({
  action,
  timezone,
  timezoneIsFallback,
}: {
  action: CalendarApproval;
  timezone: string;
  timezoneIsFallback?: boolean;
}) {
  // The card's own timezone wins when the backend states one: that is the zone
  // the event is actually being written in.
  const zone = action.timezone ?? timezone;
  const { when, duration } = formatEventTime(action, zone);

  return (
    <div className="space-y-1.5">
      {action.operation === "delete" && (
        <p className="mb-2.5 text-[12px] text-muted-foreground">
          These are the event&rsquo;s current details, read back from your
          calendar.
        </p>
      )}

      <p className="text-[15px] font-bold text-foreground">
        {action.title ?? "(untitled event)"}
      </p>

      {when && (
        <p className="text-[13px] text-foreground">
          {when}
          {duration && (
            <span className="text-muted-foreground"> · {duration}</span>
          )}
        </p>
      )}
      {!when && duration && (
        <p className="text-[13px] text-muted-foreground">{duration}</p>
      )}

      {action.location && (
        <p className="text-[13px] text-muted-foreground">{action.location}</p>
      )}

      {action.attendees.length > 0 && (
        <div className="flex items-start gap-2 pt-0.5 text-[13px] text-foreground">
          <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">
            {action.attendees.join(", ")}
          </span>
        </div>
      )}

      {action.description && (
        <p className="whitespace-pre-wrap break-words pt-1 text-[13px] leading-relaxed text-muted-foreground">
          {action.description}
        </p>
      )}

      <TimezoneCaption zone={zone} isFallback={timezoneIsFallback} />
    </div>
  );
}

function TimezoneCaption({
  zone,
  isFallback,
}: {
  zone: string;
  isFallback?: boolean;
}) {
  return (
    <p className="pt-1.5 text-[11.5px] text-muted-foreground">
      Times shown in {zone}.{" "}
      {isFallback ? (
        <>
          No timezone set —{" "}
          <Link
            href="/app/settings/integrations"
            className="underline underline-offset-2 hover:text-foreground"
          >
            set yours
          </Link>
        </>
      ) : (
        <Link
          href="/app/settings/integrations"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Change
        </Link>
      )}
    </p>
  );
}

function GenericDetails({ action }: { action: GenericApproval }) {
  return (
    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-foreground">
      {action.question}
    </p>
  );
}

/**
 * What replaces the card once the user decides — a quiet one-liner, so the
 * actionable buttons can never be clicked twice or misread as still pending.
 */
export function ApprovalStatusLine({
  action,
  choice,
}: {
  action: PendingAction;
  choice: ApprovalChoice;
}) {
  const text = statusText(action, choice);
  return (
    <p
      className={cn(
        "mx-4 my-2 text-[13px]",
        choice === "approved"
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-muted-foreground"
      )}
    >
      {text}
    </p>
  );
}

function statusText(action: PendingAction, choice: ApprovalChoice): string {
  if (choice === "cancelled") return "❌ Cancelled";
  if (choice === "replied") {
    return "↩️ Replied instead — the assistant will follow up";
  }

  if (action.kind === "email") {
    const to = action.to.join(", ");
    return to ? `✅ Sent to ${to}` : "✅ Sent";
  }
  if (action.kind === "calendar") {
    const what = action.title ? ` — ${action.title}` : "";
    if (action.operation === "delete") return `✅ Event deleted${what}`;
    if (action.operation === "update") return `✅ Event updated${what}`;
    return `✅ Event created${what}`;
  }
  return "✅ Approved";
}
