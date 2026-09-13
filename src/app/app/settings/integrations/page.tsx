"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGoogleAuthorizeUrl,
  getGoogleStatus,
  disconnectGoogle,
} from "@/lib/api/integrations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TimezoneCard } from "@/components/settings/TimezoneCard";
import { describeOAuthReason } from "@/lib/oauth-errors";
import { normalizeCapabilities } from "@/lib/google-capabilities";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  X,
  Unplug,
  Link2,
  CalendarPlus,
  CalendarClock,
  Mail,
  MailSearch,
  Lock,
} from "lucide-react";

/**
 * What the agent can actually do once Google is connected. Each row names the
 * Google scope it depends on, so a partially-granted connection shows exactly
 * which capability is missing rather than failing mysteriously mid-chat.
 */
const AGENT_CAPABILITIES = [
  {
    icon: CalendarClock,
    title: "Check your calendar",
    example: "\u201cAm I free on Thursday afternoon?\u201d",
    scope: "calendar.readonly",
  },
  {
    icon: CalendarPlus,
    title: "Create and update events",
    example: "\u201cBook a call with Sara on Monday at 10.\u201d",
    scope: "calendar.events",
    needsApproval: true,
  },
  {
    icon: MailSearch,
    title: "Read and search your inbox",
    example: "\u201cWhat did the supplier say about the invoice?\u201d",
    scope: "gmail.readonly",
  },
  {
    icon: Mail,
    title: "Send email on your behalf",
    example: "\u201cReply and confirm the meeting.\u201d",
    scope: "gmail.send",
    needsApproval: true,
  },
] as const;

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const oauthResult = searchParams.get("oauth");
  const oauthReason = searchParams.get("reason");

  const [successDismissed, setSuccessDismissed] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [disconnectNotice, setDisconnectNotice] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Auto-dismiss success alert after 3 seconds
  useEffect(() => {
    if (oauthResult === "success" && !successDismissed) {
      const timer = setTimeout(() => setSuccessDismissed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [oauthResult, successDismissed]);

  const { data: googleStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["google-status"],
    queryFn: getGoogleStatus,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-status"] });
      setConfirmDisconnect(false);
      setDisconnectNotice(true);
      setTimeout(() => setDisconnectNotice(false), 3000);
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const response = await getGoogleAuthorizeUrl();
      window.location.href = response.url;
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Failed to start Google sign-in."
      );
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const connectedEmail =
    googleStatus?.email ?? googleStatus?.google_email ?? null;

  const capabilities = normalizeCapabilities(googleStatus);

  return (
    <div className="max-w-xl space-y-6">
      {/* OAuth success alert */}
      {oauthResult === "success" && !successDismissed && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span>Google account connected successfully!</span>
            <button
              onClick={() => setSuccessDismissed(true)}
              aria-label="Dismiss"
              className="ml-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* OAuth error alert */}
      {oauthResult === "error" && !errorDismissed && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>
              Failed to connect Google account.{" "}
              {describeOAuthReason(oauthReason)}
            </span>
            <button
              onClick={() => setErrorDismissed(true)}
              aria-label="Dismiss"
              className="ml-2 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Disconnect notice */}
      {disconnectNotice && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Google account disconnected successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Connect error */}
      {connectError && (
        <Alert variant="destructive">
          <AlertDescription>{connectError}</AlertDescription>
        </Alert>
      )}

      {/* Google integration card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* Google G icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-border shadow-sm flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">Google</CardTitle>
                {!statusLoading && googleStatus?.connected && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {statusLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-9 w-36" />
            </div>
          ) : googleStatus?.connected ? (
            <div className="space-y-4">
              <div className="space-y-1">
                {connectedEmail && (
                  <p className="text-sm font-semibold text-foreground break-words">
                    {connectedEmail}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Grants access to Gmail and Calendar.
                </p>
              </div>

              {capabilities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Connected products
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {capabilities.map((capability) => (
                      <Badge
                        key={capability.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {capability.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDisconnect(true)}
                disabled={disconnectMutation.isPending}
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <Unplug className="h-4 w-4" />
                {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google account to enable Gmail and Calendar access.
              </p>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="gap-2"
              >
                <Link2 className="h-4 w-4" />
                {isConnecting ? "Connecting…" : "Connect Google"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What the agent can do with this connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent capabilities</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {googleStatus?.connected
              ? "Ask for these in plain language from any chat."
              : "Connect Google above to unlock these in chat."}
          </p>
        </CardHeader>

        <CardContent className="space-y-1">
          {AGENT_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            const granted =
              googleStatus?.connected &&
              googleStatus.scopes.some((s) => s.includes(cap.scope));

            return (
              <div
                key={cap.title}
                className={cn(
                  "flex items-start gap-3 rounded-[12px] px-3 py-3 transition-opacity",
                  !granted && "opacity-55"
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] border border-brand-border bg-brand-soft text-brand-text">
                  {granted ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {cap.title}
                    </p>
                    {"needsApproval" in cap && cap.needsApproval && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400"
                      >
                        Asks first
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] italic text-muted-foreground">
                    {cap.example}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <TimezoneCard />

      {/* Disconnecting revokes calendar and mailbox access, so confirm first. */}
      <AlertDialog
        open={confirmDisconnect}
        onOpenChange={(open) => {
          if (!disconnectMutation.isPending) setConfirmDisconnect(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
            <AlertDialogDescription>
              Aurynix will lose calendar/email access until you reconnect
              {connectedEmail ? ` ${connectedEmail}` : ""}. Events already
              created and emails already sent are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {disconnectMutation.isError && (
            <p className="text-sm text-destructive">
              {disconnectMutation.error instanceof Error
                ? disconnectMutation.error.message
                : "Couldn't disconnect. Please try again."}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectMutation.isPending}>
              Keep connected
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDisconnect();
              }}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
