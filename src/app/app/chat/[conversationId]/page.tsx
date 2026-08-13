"use client";

import { use } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversation } from "@/hooks/useConversations";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationChatPage({ params }: Props) {
  const { conversationId } = use(params);
  const { data, isLoading, error } = useConversation(conversationId);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "justify-end" : ""}`}>
              {i % 2 !== 0 && <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />}
              <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-72"}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-border h-20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-center p-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Conversation not found</p>
          <p className="text-xs text-muted-foreground">
            This conversation may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      initialMessages={data.messages}
      conversationStatus={data.status}
    />
  );
}
