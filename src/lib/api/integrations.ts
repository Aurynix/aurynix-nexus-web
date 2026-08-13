import { apiClient } from "./client";
import type { GoogleAuthorizeResponse, GoogleStatusResponse } from "@/types/integration";

export async function getGoogleAuthorizeUrl(): Promise<GoogleAuthorizeResponse> {
  return apiClient.get<GoogleAuthorizeResponse>("/oauth/google/authorize");
}

export async function getGoogleStatus(): Promise<GoogleStatusResponse> {
  return apiClient.get<GoogleStatusResponse>("/oauth/google/status");
}

export async function disconnectGoogle(): Promise<void> {
  return apiClient.delete("/oauth/google/disconnect");
}
