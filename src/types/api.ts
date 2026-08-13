export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export interface HealthResponse {
  status: "ok";
}

export interface ReadinessResponse {
  status: "ready" | "degraded";
  checks: {
    postgres: "ok" | "error";
    redis: "ok" | "error";
    qdrant: "ok" | "error";
  };
}
