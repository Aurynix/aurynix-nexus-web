"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { MessageResponse } from "@/types/conversation";
import { streamChat, type StreamController } from "@/lib/chat/stream";
import { CONVERSATIONS_KEY, conversationKey } from "@/hooks/useConversations";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ChatComposer } from "./ChatComposer";
import { InterruptBanner } from "./InterruptBanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatState {
  messages: MessageResponse[];
  streamingContent: string;
  isStreaming: boolean;
  isThinking: boolean;
  activeTool: string | null;
  interrupt: string | null;
  error: string | null;
  conversationId: string | null;
}

type ChatAction =
  | { type: "SET_MESSAGES"; messages: MessageResponse[] }
  | { type: "ADD_USER_MESSAGE"; message: MessageResponse }
  | { type: "START_STREAMING"; conversationId: string | null }
  | { type: "TOKEN"; content: string }
  | { type: "TOOL_START"; tool: string }
  | { type: "TOOL_END" }
  | { type: "INTERRUPT"; question: string }
  | { type: "STREAM_DONE" }
  | { type: "STREAM_ERROR"; error: string }
  | { type: "SET_CONVERSATION_ID"; id: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "START_STREAMING":
      return {
        ...state,
        isStreaming: true,
        isThinking: true,
        streamingContent: "",
        activeTool: null,
        interrupt: null,
        error: null,
        conversationId: action.conversationId ?? state.conversationId,
      };
    case "TOKEN":
      return {
        ...state,
        isThinking: false,
        streamingContent: state.streamingContent + action.content,
      };
    case "TOOL_START":
      return { ...state, activeTool: action.tool, isThinking: false };
    case "TOOL_END":
      return { ...state, activeTool: null };
    case "INTERRUPT":
      return {
        ...state,
        interrupt: action.question,
        isStreaming: false,
        isThinking: false,
      };
    case "STREAM_DONE": {
      const assistantMessage: MessageResponse = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: state.streamingContent,
        created_at: new Date().toISOString(),
      };
      return {
        ...state,
        messages:
          state.streamingContent
            ? [...state.messages, assistantMessage]
            : state.messages,
        streamingContent: "",
        isStreaming: false,
        isThinking: false,
        activeTool: null,
      };
    }
    case "STREAM_ERROR":
      return {
        ...state,
        isStreaming: false,
        isThinking: false,
        activeTool: null,
        error: action.error,
        streamingContent: "",
      };
    case "SET_CONVERSATION_ID":
      return { ...state, conversationId: action.id };
    default:
      return state;
  }
}

interface ChatWindowProps {
  conversationId?: string;
  initialMessages?: MessageResponse[];
  conversationStatus?: "active" | "interrupted";
}

const SUGGESTED_PROMPTS = [
  "Analyze my business performance",
  "Summarize recent documents",
  "Search knowledge base",
  "Help me write a report",
];

export function ChatWindow({
  conversationId: initialConversationId,
  initialMessages = [],
  conversationStatus,
}: ChatWindowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(chatReducer, {
    messages: initialMessages,
    streamingContent: "",
    isStreaming: false,
    isThinking: false,
    activeTool: null,
    interrupt: null,
    error: null,
    conversationId: initialConversationId ?? null,
  });

  const [input, setInput] = useState("");
  const streamRef = useRef<StreamController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Track previous conversation ID and whether messages have been hydrated.
  // Using refs so the effect below doesn't need them as deps (avoids stale-closure
  // issues while still preventing the new-array-reference infinite loop that the
  // default `initialMessages = []` parameter would otherwise cause).
  const prevConversationIdRef = useRef(initialConversationId);
  const didHydrateRef = useRef(initialMessages.length > 0);

  // Sync messages only on meaningful changes: conversation switch or first load.
  useEffect(() => {
    const idChanged = initialConversationId !== prevConversationIdRef.current;
    const justHydrated = !didHydrateRef.current && initialMessages.length > 0;

    if (idChanged || justHydrated) {
      prevConversationIdRef.current = initialConversationId;
      didHydrateRef.current = initialMessages.length > 0;
      dispatch({ type: "SET_MESSAGES", messages: initialMessages });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.streamingContent, state.isThinking]);

  const handleStop = useCallback(() => {
    streamRef.current?.abort();
    streamRef.current = null;
    dispatch({ type: "STREAM_DONE" });
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || state.isStreaming) return;

    setInput("");

    const userMessage: MessageResponse = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: "ADD_USER_MESSAGE", message: userMessage });
    dispatch({ type: "START_STREAMING", conversationId: state.conversationId });

    const conversationIdRef = { current: state.conversationId };

    const controller = await streamChat(
      {
        message: trimmed,
        conversation_id: state.conversationId,
      },
      {
        onMetadata: (id) => {
          conversationIdRef.current = id;
          dispatch({ type: "SET_CONVERSATION_ID", id });
          // Navigate to conversation URL without reload
          if (!initialConversationId) {
            router.replace(`/app/chat/${id}`, { scroll: false });
          }
          // Invalidate conversations list
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
        },
        onToken: (content) => {
          dispatch({ type: "TOKEN", content });
        },
        onToolStart: (tool) => {
          dispatch({ type: "TOOL_START", tool });
        },
        onToolEnd: () => {
          dispatch({ type: "TOOL_END" });
        },
        onInterrupt: (question) => {
          dispatch({ type: "INTERRUPT", question });
          // Refresh conversation data to get interrupted status
          if (conversationIdRef.current) {
            queryClient.invalidateQueries({
              queryKey: conversationKey(conversationIdRef.current),
            });
          }
        },
        onDone: () => {
          dispatch({ type: "STREAM_DONE" });
          // Refresh conversation
          if (conversationIdRef.current) {
            queryClient.invalidateQueries({
              queryKey: conversationKey(conversationIdRef.current),
            });
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
          }
        },
        onError: (detail) => {
          dispatch({ type: "STREAM_ERROR", error: detail });
        },
      }
    );

    streamRef.current = controller;
  }, [
    input,
    state.isStreaming,
    state.conversationId,
    initialConversationId,
    router,
    queryClient,
  ]);

  const isEmpty = state.messages.length === 0 && !state.isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        {isEmpty ? (
          <EmptyState
            onPromptSelect={(prompt) => {
              setInput(prompt);
            }}
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            {state.messages
              .filter((m) => m.role !== "tool")
              .map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

            {state.isStreaming && (
              <StreamingMessage
                content={state.streamingContent}
                activeTool={state.activeTool}
                isThinking={state.isThinking}
              />
            )}

            {state.interrupt && (
              <InterruptBanner question={state.interrupt} />
            )}

            {state.error && (
              <div className="mx-4 my-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{state.error}</p>
                <button
                  onClick={() => dispatch({ type: "STREAM_ERROR", error: "" })}
                  className="text-xs text-muted-foreground underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={state.isStreaming}
        />
      </div>
    </div>
  );
}

function EmptyState({
  onPromptSelect,
}: {
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Aurynix Nexus
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        How can I help your business today?
      </p>

      <div
        className={cn(
          "grid gap-2 w-full max-w-lg",
          SUGGESTED_PROMPTS.length <= 2 ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            className="text-sm h-auto py-3 px-4 text-left justify-start font-normal text-muted-foreground hover:text-foreground"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
