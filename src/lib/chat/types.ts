import type { SSEEvent } from "@/types/chat";

export type { SSEEvent };

export interface StreamState {
  conversationId: string | null;
  content: string;
  isStreaming: boolean;
  isThinking: boolean;
  activeTool: string | null;
  interrupt: string | null;
  error: string | null;
  isDone: boolean;
}

export const initialStreamState: StreamState = {
  conversationId: null,
  content: "",
  isStreaming: false,
  isThinking: false,
  activeTool: null,
  interrupt: null,
  error: null,
  isDone: false,
};

export interface StreamCallbacks {
  onMetadata?: (conversationId: string) => void;
  onToken?: (content: string) => void;
  onToolStart?: (tool: string, input: string) => void;
  onToolEnd?: (tool: string) => void;
  onInterrupt?: (question: string) => void;
  onError?: (detail: string) => void;
  onDone?: () => void;
}
