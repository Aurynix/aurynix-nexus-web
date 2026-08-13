export interface ConversationResponse {
  id: string;
  title: string | null;
  status: "active" | "interrupted";
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  created_at: string;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
}
