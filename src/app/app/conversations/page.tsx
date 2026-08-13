"use client";

import { useState } from "react";
import Link from "next/link";
import { MessagesSquare, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversationTitle, formatRelativeTime } from "@/lib/utils";
import { useConversations, useDeleteConversation } from "@/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { ConversationResponse } from "@/types/conversation";

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

interface ConversationGroup {
  label: string;
  items: ConversationResponse[];
}

function groupConversationsByDate(
  conversations: ConversationResponse[]
): ConversationGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: ConversationGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const conv of conversations) {
    const convDate = new Date(conv.updated_at);
    convDate.setHours(0, 0, 0, 0);

    if (convDate.getTime() === today.getTime()) {
      groups[0].items.push(conv);
    } else if (convDate.getTime() === yesterday.getTime()) {
      groups[1].items.push(conv);
    } else {
      groups[2].items.push(conv);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

// ---------------------------------------------------------------------------
// Conversation row
// ---------------------------------------------------------------------------

interface ConversationRowProps {
  conversation: ConversationResponse;
}

function ConversationRow({ conversation }: ConversationRowProps) {
  const deleteMutation = useDeleteConversation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const title = getConversationTitle(conversation.title, [], "New conversation");

  const handleDelete = () => {
    deleteMutation.mutate(conversation.id, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <div className="group relative flex items-center">
      <Link
        href={`/app/chat/${conversation.id}`}
        className={cn(
          "flex flex-1 items-center gap-3 rounded-lg px-4 py-3 min-w-0",
          "hover:bg-muted/60 transition-colors"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {title}
            </span>
            {conversation.status === "interrupted" && (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-500 flex-shrink-0 text-xs py-0"
              >
                Interrupted
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelativeTime(conversation.updated_at)}
          </p>
        </div>
      </Link>

      {/* Delete button — visible on hover */}
      <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{title}&rdquo; and all its
                messages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConversationsPage() {
  const { data: conversations, isLoading, error } = useConversations();

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Conversations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your conversation history
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load conversations."}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!isLoading && !error && conversations && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MessagesSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-base font-medium text-foreground mb-1">
              No conversations yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start a new chat to get started
            </p>
            <Button asChild size="sm">
              <Link href="/app/chat">
                <Plus className="h-4 w-4 mr-2" />
                New chat
              </Link>
            </Button>
          </div>
        )}

        {/* Conversations grouped by date */}
        {!isLoading && !error && conversations && conversations.length > 0 && (
          <div className="space-y-6">
            {groupConversationsByDate(conversations).map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-2 px-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <ConversationRow key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
