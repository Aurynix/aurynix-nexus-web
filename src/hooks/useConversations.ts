import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversations,
  getConversation,
  deleteConversation,
} from "@/lib/api/conversations";

export const CONVERSATIONS_KEY = ["conversations"] as const;
export const conversationKey = (id: string) => ["conversation", id] as const;

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: listConversations,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKey(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: conversationKey(id) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
