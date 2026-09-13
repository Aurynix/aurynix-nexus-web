"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { UserResponse } from "@/types/auth";
import type { LoginRequest, RegisterRequest } from "@/types/auth";
import {
  login,
  logout,
  register,
  refreshSession,
  getMe,
  exchangeGoogleCode,
} from "@/lib/api/auth";
import { tokenStore } from "@/lib/api/client";

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (data: LoginRequest) => Promise<void>;
  signUp: (data: RegisterRequest) => Promise<void>;
  completeGoogleSignIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
      tokenStore.clear();
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      setIsLoading(true);
      try {
        // Check if we have an access token already
        if (tokenStore.getAccessToken()) {
          await refreshUser();
        } else {
          // Try refreshing from stored refresh token
          const restoredUser = await refreshSession();
          setUser(restoredUser);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const signIn = useCallback(
    async (data: LoginRequest) => {
      await login(data);
      const me = await getMe();
      setUser(me);
      router.push("/app");
    },
    [router]
  );

  const signUp = useCallback(
    async (data: RegisterRequest) => {
      await register(data);
      const me = await getMe();
      setUser(me);
      router.push("/app");
    },
    [router]
  );

  const completeGoogleSignIn = useCallback(
    async (code: string) => {
      await exchangeGoogleCode(code);
      const me = await getMe();
      setUser(me);
      // replace(): the callback URL holds a spent code, so it must not stay in
      // history for the back button to land on.
      router.replace("/app");
    },
    [router]
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    completeGoogleSignIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
