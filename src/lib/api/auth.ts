import { apiClient, tokenStore } from "./client";
import type {
  GoogleAuthUrlResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from "@/types/auth";

export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const tokens = await apiClient.post<TokenResponse>("/auth/register", data, { skipAuth: true });
  tokenStore.setAccessToken(tokens.access_token);
  tokenStore.setRefreshToken(tokens.refresh_token);
  return tokens;
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const tokens = await apiClient.post<TokenResponse>("/auth/login", data, { skipAuth: true });
  tokenStore.setAccessToken(tokens.access_token);
  tokenStore.setRefreshToken(tokens.refresh_token);
  return tokens;
}

/**
 * Step 1 of Google sign-in: ask the backend where to send the browser.
 * Public — the user has no session yet. `mode` lets the backend decide whether
 * an unknown Google account should be rejected ("signin") or provisioned
 * ("signup").
 */
export async function startGoogleAuth(
  mode: "signin" | "signup"
): Promise<GoogleAuthUrlResponse> {
  return apiClient.get<GoogleAuthUrlResponse>(
    `/auth/google/authorize?mode=${mode}`,
    { skipAuth: true }
  );
}

/**
 * Step 2: trade the single-use code the backend put on the callback URL for a
 * real token pair. Tokens are deliberately NOT passed through the URL — a
 * refresh token in browser history / server logs is a credential leak.
 */
export async function exchangeGoogleCode(
  code: string
): Promise<TokenResponse> {
  const tokens = await apiClient.post<TokenResponse>(
    "/auth/google/exchange",
    { code },
    { skipAuth: true }
  );
  tokenStore.setAccessToken(tokens.access_token);
  tokenStore.setRefreshToken(tokens.refresh_token);
  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    tokenStore.clear();
  }
}

export async function refreshSession(): Promise<UserResponse | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await apiClient.post<TokenResponse>(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { skipAuth: true }
    );
    tokenStore.setAccessToken(tokens.access_token);
    tokenStore.setRefreshToken(tokens.refresh_token);
    return getMe();
  } catch {
    tokenStore.clear();
    return null;
  }
}

export async function getMe(): Promise<UserResponse> {
  return apiClient.get<UserResponse>("/auth/me");
}
