import type { ApiError } from "@/types/api";

// Use the Next.js proxy path so the browser never makes a cross-origin request.
// next.config.ts rewrites /api/proxy/* → NEXT_PUBLIC_API_URL/*
const BASE_URL = "/api/proxy";

// In-memory access token store (never persisted)
let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export const tokenStore = {
  getAccessToken: () => _accessToken,
  setAccessToken: (token: string | null) => {
    _accessToken = token;
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("nexus_refresh_token");
  },
  setRefreshToken: (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("nexus_refresh_token", token);
      document.cookie = "nexus_session=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      localStorage.removeItem("nexus_refresh_token");
      document.cookie = "nexus_session=; path=/; max-age=0; SameSite=Lax";
    }
  },
  clear: () => {
    _accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexus_refresh_token");
      document.cookie = "nexus_session=; path=/; max-age=0; SameSite=Lax";
    }
  },
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      tokenStore.clear();
      return null;
    }

    const data = await response.json();
    tokenStore.setAccessToken(data.access_token);
    tokenStore.setRefreshToken(data.refresh_token);
    return data.access_token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const token = tokenStore.getAccessToken();
  if (token) return token;

  // Deduplicate concurrent refresh calls
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = refreshAccessToken().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  isFormData?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth, isFormData, ...init } = options;

  // Build URL
  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Build headers
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  if (init.headers) {
    Object.assign(headers, init.headers);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Retry once on 401 by refreshing token
  if (response.status === 401 && !skipAuth) {
    tokenStore.setAccessToken(null);
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retryResponse = await fetch(url, { ...init, headers: retryHeaders });

      if (retryResponse.status === 204) return undefined as T;

      if (!retryResponse.ok) {
        await handleErrorResponse(retryResponse);
      }

      return retryResponse.json() as Promise<T>;
    }
    // No token after refresh — session expired
    tokenStore.clear();
    throw new ApiRequestError({ status: 401, message: "Session expired. Please sign in again." });
  }

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

async function handleErrorResponse(response: Response): Promise<never> {
  let message = getDefaultMessage(response.status);
  let details: unknown;

  try {
    const body = await response.json();
    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      // FastAPI validation errors
      message = body.detail.map((e: { msg: string }) => e.msg).join(", ");
      details = body.detail;
    }
  } catch {
    // Not JSON — use default message
  }

  throw new ApiRequestError({ status: response.status, message, details });
}

function getDefaultMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Bad request.",
    401: "Authentication required.",
    403: "You don't have permission to do that.",
    404: "Not found.",
    409: "Conflict — this resource already exists.",
    422: "Validation error.",
    429: "Too many requests. Please slow down.",
    500: "Server error. Please try again later.",
    502: "Server unavailable. Please try again later.",
    503: "Service temporarily unavailable.",
  };
  return messages[status] ?? "An unexpected error occurred.";
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      isFormData: body instanceof FormData,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
