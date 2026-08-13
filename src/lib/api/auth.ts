import { apiClient, tokenStore } from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "@/types/auth";

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
