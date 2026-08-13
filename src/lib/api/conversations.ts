import { apiClient } from "./client";
import type { ConversationResponse, ConversationDetailResponse } from "@/types/conversation";

export async function listConversations(): Promise<ConversationResponse[]> {
  return apiClient.get<ConversationResponse[]>("/chat/conversations");
}

export async function getConversation(id: string): Promise<ConversationDetailResponse> {
  return apiClient.get<ConversationDetailResponse>(`/chat/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  return apiClient.delete(`/chat/conversations/${id}`);
}
