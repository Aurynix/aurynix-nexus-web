import { tokenStore } from "@/lib/api/client";
import { parseSSEChunk } from "./event-parser";
import type { StreamCallbacks } from "./types";
import type { ChatRequest } from "@/types/chat";

const BASE_URL = "/api/proxy";

export interface StreamController {
  abort: () => void;
}

export async function streamChat(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<StreamController> {
  const controller = new AbortController();

  // Merge with external signal
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  const token = tokenStore.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Start fetch in background (non-blocking)
  (async () => {
    try {
      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = "Stream request failed.";
        try {
          const body = await response.json();
          if (typeof body?.detail === "string") message = body.detail;
        } catch {
          // ignore
        }
        callbacks.onError?.(message);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.("No response body.");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE lines end with \n)
        const lines = buffer.split("\n");
        // Keep incomplete last line in buffer
        buffer = lines.pop() ?? "";

        const chunk = lines.join("\n");
        for (const event of parseSSEChunk(chunk)) {
          switch (event.type) {
            case "metadata":
              callbacks.onMetadata?.(event.conversation_id);
              break;
            case "token":
              callbacks.onToken?.(event.content);
              break;
            case "tool_start":
              callbacks.onToolStart?.(event.tool, event.input);
              break;
            case "tool_end":
              callbacks.onToolEnd?.(event.tool);
              break;
            case "interrupt":
              callbacks.onInterrupt?.(event.question);
              break;
            case "error":
              callbacks.onError?.(event.detail);
              break;
            case "done":
              callbacks.onDone?.();
              break;
            case "ping":
            case "agent_start":
              // No-op for UI
              break;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Cancelled by user — not an error
        callbacks.onDone?.();
        return;
      }
      callbacks.onError?.(
        err instanceof Error ? err.message : "Connection error."
      );
    }
  })();

  return { abort: () => controller.abort() };
}
