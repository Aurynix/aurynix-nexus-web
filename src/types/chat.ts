export interface ChatRequest {
  message: string;
  conversation_id: string | null;
}

export type SSEEventType =
  | "metadata"
  | "agent_start"
  | "tool_start"
  | "tool_end"
  | "token"
  | "interrupt"
  | "error"
  | "done"
  | "ping";

export interface SSEMetadata {
  type: "metadata";
  conversation_id: string;
}

export interface SSEAgentStart {
  type: "agent_start";
  agent: string;
}

export interface SSEToolStart {
  type: "tool_start";
  tool: string;
  input: string;
}

export interface SSEToolEnd {
  type: "tool_end";
  tool: string;
}

export interface SSEToken {
  type: "token";
  content: string;
}

export interface SSEInterrupt {
  type: "interrupt";
  question: string;
  /**
   * Structured description of the write the agent wants to perform (the email
   * it would send, the event it would book). Optional: older backends send only
   * `question`, and the extra keys are read defensively by
   * `parsePendingAction`, which falls back to parsing `question` itself.
   */
  action?: unknown;
  payload?: unknown;
  data?: unknown;
  tool?: string;
}

export interface SSEError {
  type: "error";
  detail: string;
}

export interface SSEDone {
  type: "done";
}

export interface SSEPing {
  type: "ping";
}

export type SSEEvent =
  | SSEMetadata
  | SSEAgentStart
  | SSEToolStart
  | SSEToolEnd
  | SSEToken
  | SSEInterrupt
  | SSEError
  | SSEDone
  | SSEPing;
