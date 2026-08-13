"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, ShieldCheck, Lock } from "lucide-react";

export default function SecurityPage() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Session card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Session</CardTitle>
          </div>
          <CardDescription>
            Your session is secured with JWT authentication. Access tokens expire
            in 60 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Password</CardTitle>
          </div>
          <CardDescription>Manage your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Password management is not yet available in this version.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
