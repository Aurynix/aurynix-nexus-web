"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      {/* Info alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Profile editing coming soon — the backend does not yet support profile
          updates.
        </AlertDescription>
      </Alert>

      {/* Account card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + email row */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {user.email}
              </p>
              <div className="mt-1">
                {user.is_active ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground flex-shrink-0">
                Email
              </span>
              <span className="text-sm text-foreground truncate text-right">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground flex-shrink-0">
                Account ID
              </span>
              <span className="text-sm text-foreground font-mono truncate text-right max-w-[220px]">
                {user.id}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground flex-shrink-0">
                Member since
              </span>
              <span className="text-sm text-foreground">{memberSince}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
