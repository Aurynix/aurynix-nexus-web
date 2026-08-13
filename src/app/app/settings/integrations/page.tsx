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
import { CheckCircle2, X, Unplug, Link2 } from "lucide-react";

function formatScope(scope: string): string {
  if (scope.includes("gmail")) return "Gmail";
  if (scope.includes("calendar")) return "Google Calendar";
  if (scope.includes("drive")) return "Google Drive";
  if (scope.includes("contacts")) return "Google Contacts";
  if (scope.includes("profile")) return "Profile";
  if (scope.includes("email")) return "Email";
  const parts = scope.split(/[./]/);
  return parts[parts.length - 1] ?? scope;
}

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
              Failed to connect Google account
              {oauthReason ? `: ${oauthReason}` : "."}
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
              <p className="text-sm text-muted-foreground">
                Grants access to Gmail and Calendar.
              </p>

              {googleStatus.scopes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Active scopes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {googleStatus.scopes.map((scope) => (
                      <Badge
                        key={scope}
                        variant="secondary"
                        className="text-xs"
                      >
                        {formatScope(scope)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
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
    </div>
  );
}
