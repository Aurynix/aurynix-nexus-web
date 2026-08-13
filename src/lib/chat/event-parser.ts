import type { SSEEvent } from "@/types/chat";

export function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith("data:")) return null;

  const data = line.slice(5).trim();
  if (!data || data === "[DONE]") return null;

  try {
    const parsed = JSON.parse(data) as SSEEvent;
    if (!parsed || typeof parsed.type !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function* parseSSEChunk(chunk: string): Generator<SSEEvent> {
  const lines = chunk.split("\n");
  for (const line of lines) {
    const event = parseSSELine(line.trim());
    if (event) yield event;
  }
}
