"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { MessageResponse } from "@/types/conversation";
import type {
  ApprovalChoice,
  PendingAction,
  ResolvedAction,
} from "@/types/approval";
import { streamChat, type StreamController } from "@/lib/chat/stream";
import { parsePendingAction } from "@/lib/chat/pending-action";
import { CONVERSATIONS_KEY, conversationKey } from "@/hooks/useConversations";
import { MEMORY_KEY } from "@/hooks/useMemory";
import { useTimezone } from "@/hooks/useTimezone";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ChatComposer } from "./ChatComposer";
import {
  ApprovalCard,
  ApprovalStatusLine,
  type ApprovalStatus,
} from "./ApprovalCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A decision the user made that is being sent to the backend. */
interface Decision {
  choice: Exclude<ApprovalChoice, "replied">;
  action: PendingAction;
  status: ApprovalStatus;
  error: string | null;
}

interface ChatState {
  messages: MessageResponse[];
  streamingContent: string;
  isStreaming: boolean;
  isThinking: boolean;
  activeTool: string | null;
  /** A write the agent paused on, awaiting approval. */
  pending: PendingAction | null;
  /** The in-flight approve/cancel, if the user has clicked. */
  decision: Decision | null;
  /** Decisions already made, rendered as status lines in the transcript. */
  resolved: ResolvedAction[];
  /** Suppresses the reload-time "paused" card once the user has acted. */
  statusPendingDismissed: boolean;
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
  | { type: "INTERRUPT"; action: PendingAction }
  | {
      type: "DECIDE_START";
      choice: Exclude<ApprovalChoice, "replied">;
      action: PendingAction;
    }
  | { type: "DECIDE_COMMIT" }
  | { type: "DECIDE_FAILED"; error: string }
  | { type: "RESOLVE_AS_REPLIED" }
  | { type: "STREAM_DONE"; aborted?: boolean }
  | { type: "STREAM_ERROR"; error: string }
  | { type: "SET_CONVERSATION_ID"; id: string };

/** Anchors a status line to the message it follows, so ordering survives. */
function lastMessageId(state: ChatState): string | null {
  return state.messages[state.messages.length - 1]?.id ?? null;
}

function resolve(
  state: ChatState,
  action: PendingAction,
  choice: ApprovalChoice
): ResolvedAction[] {
  return [
    ...state.resolved,
    {
      id: crypto.randomUUID(),
      action,
      choice,
      afterMessageId: lastMessageId(state),
    },
  ];
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
        statusPendingDismissed: true,
      };
    case "START_STREAMING":
      return {
        ...state,
        isStreaming: true,
        isThinking: true,
        streamingContent: "",
        activeTool: null,
        // `pending`/`decision` deliberately survive: the resume *is* this
        // stream, and the card stays visible (disabled) until it takes.
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
        pending: action.action,
        isStreaming: false,
        isThinking: false,
        statusPendingDismissed: true,
      };
    case "DECIDE_START":
      return {
        ...state,
        pending: null,
        statusPendingDismissed: true,
        decision: {
          choice: action.choice,
          action: action.action,
          status: "submitting",
          error: null,
        },
      };
    case "DECIDE_COMMIT": {
      if (!state.decision) return state;
      return {
        ...state,
        resolved: resolve(state, state.decision.action, state.decision.choice),
        decision: null,
      };
    }
    case "DECIDE_FAILED": {
      if (!state.decision) return state;
      return {
        ...state,
        isStreaming: false,
        isThinking: false,
        activeTool: null,
        streamingContent: "",
        decision: {
          ...state.decision,
          status: "failed",
          error: action.error,
        },
      };
    }
    case "RESOLVE_AS_REPLIED": {
      // Free text is not a click: the backend decides what it means, so the
      // card retires with a neutral line rather than claiming a cancellation.
      const action = state.pending ?? state.decision?.action;
      if (!action) return state;
      return {
        ...state,
        resolved: resolve(state, action, "replied"),
        pending: null,
        decision: null,
      };
    }
    case "STREAM_DONE": {
      const assistantMessage: MessageResponse = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: state.streamingContent,
        created_at: new Date().toISOString(),
      };
      const producedNothing =
        !state.streamingContent &&
        !action.aborted &&
        !state.pending &&
        !state.decision;
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
        // A stream that closes without a single token is a failure, not a
        // silent success — surface it instead of leaving the thread hanging.
        error: producedNothing
          ? "The assistant ended the response without sending anything. Please try again."
          : state.error,
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
  /** A message typed on another page, sent as soon as this one mounts. */
  initialPrompt?: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze my business performance",
  "Summarize recent documents",
  "Search knowledge base",
  "Help me write a report",
];

/**
 * A conversation reloaded in the `interrupted` state is still paused, but the
 * interrupt payload only existed in the stream that has since closed. Offer the
 * approval buttons anyway — "yes"/"no" resume the graph either way.
 */
const PAUSED_ON_RELOAD: PendingAction = {
  kind: "generic",
  question:
    "This conversation is paused waiting for your approval. Approve to let the assistant continue, or reply below with what to change.",
  hint: null,
  raw: "",
};

export function ChatWindow({
  conversationId: initialConversationId,
  initialMessages = [],
  conversationStatus,
  initialPrompt,
}: ChatWindowProps) {
  const queryClient = useQueryClient();
  const { timezone, source: timezoneSource } = useTimezone();

  const [state, dispatch] = useReducer(chatReducer, {
    messages: initialMessages,
    streamingContent: "",
    isStreaming: false,
    isThinking: false,
    activeTool: null,
    pending: null,
    decision: null,
    resolved: [],
    statusPendingDismissed: false,
    error: null,
    conversationId: initialConversationId ?? null,
  });

  const [input, setInput] = useState("");
  const streamRef = useRef<StreamController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Marks an approve/cancel whose resume stream hasn't produced anything yet.
  const decisionInFlightRef = useRef(false);

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
  }, [initialConversationId, initialMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    state.messages,
    state.streamingContent,
    state.isThinking,
    state.pending,
    state.resolved,
  ]);

  const handleStop = useCallback(() => {
    streamRef.current?.abort();
    streamRef.current = null;
    dispatch({ type: "STREAM_DONE", aborted: true });
  }, []);

  /**
   * Opens a stream and wires it to the reducer. `silent` omits the user bubble,
   * used for button-driven approvals where the status line is the record.
   */
  const startStream = useCallback(
    async (text: string, options?: { silent?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!options?.silent) {
        dispatch({
          type: "ADD_USER_MESSAGE",
          message: {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
            created_at: new Date().toISOString(),
          },
        });
      }

      dispatch({
        type: "START_STREAMING",
        conversationId: state.conversationId,
      });

      const conversationIdRef = { current: state.conversationId };

      // The resume is "accepted" as soon as the backend says anything back.
      const commitDecision = () => {
        if (!decisionInFlightRef.current) return;
        decisionInFlightRef.current = false;
        dispatch({ type: "DECIDE_COMMIT" });
      };

      const controller = await streamChat(
        {
          message: trimmed,
          conversation_id: state.conversationId,
        },
        {
          onMetadata: (id) => {
            conversationIdRef.current = id;
            dispatch({ type: "SET_CONVERSATION_ID", id });
            // Reflect the new conversation in the URL *without* a route change.
            // router.replace() would navigate from /app/chat to
            // /app/chat/[conversationId], unmounting this component and killing
            // the in-flight stream before the first token arrives. The native
            // History API integrates with the App Router but keeps us mounted.
            if (!initialConversationId) {
              window.history.replaceState(null, "", `/app/chat/${id}`);
            }
            // Invalidate conversations list
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
          },
          onToken: (content) => {
            commitDecision();
            dispatch({ type: "TOKEN", content });
          },
          onToolStart: (tool) => {
            commitDecision();
            dispatch({ type: "TOOL_START", tool });
          },
          onToolEnd: () => {
            dispatch({ type: "TOOL_END" });
          },
          onInterrupt: (event) => {
            commitDecision();
            dispatch({ type: "INTERRUPT", action: parsePendingAction(event) });
            // Refresh conversation data to get interrupted status
            if (conversationIdRef.current) {
              queryClient.invalidateQueries({
                queryKey: conversationKey(conversationIdRef.current),
              });
            }
          },
          onDone: () => {
            commitDecision();
            dispatch({ type: "STREAM_DONE" });
            // A turn can change stored facts two ways: the agent calling the
            // remember/forget tools, or background extraction after the turn.
            // Neither is visible from here, so mark memory stale on every turn —
            // the list is small and only refetches when the page is next open.
            queryClient.invalidateQueries({ queryKey: MEMORY_KEY });
            // Refresh conversation
            if (conversationIdRef.current) {
              queryClient.invalidateQueries({
                queryKey: conversationKey(conversationIdRef.current),
              });
              queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
            }
          },
          onError: (detail) => {
            // A failed resume keeps the card alive with a retry rather than
            // dropping the pending action into a generic error box.
            if (decisionInFlightRef.current) {
              decisionInFlightRef.current = false;
              dispatch({ type: "DECIDE_FAILED", error: detail });
              return;
            }
            dispatch({ type: "STREAM_ERROR", error: detail });
          },
        }
      );

      streamRef.current = controller;
    },
    [state.conversationId, initialConversationId, queryClient]
  );

  const submitMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || state.isStreaming) return;
      setInput("");
      // Typing instead of clicking is a legitimate answer to a pause; the
      // backend interprets it, we just stop showing the buttons.
      if (state.pending || state.decision) {
        dispatch({ type: "RESOLVE_AS_REPLIED" });
      }
      await startStream(text);
    },
    [startStream, state.isStreaming, state.pending, state.decision]
  );

  const handleSubmit = useCallback(
    () => submitMessage(input),
    [submitMessage, input]
  );

  // Send a prompt handed over from another page, exactly once. The query string
  // is dropped straight away so a refresh can't silently resend it.
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (!initialPrompt?.trim() || autoSentRef.current) return;
    autoSentRef.current = true;
    window.history.replaceState(null, "", "/app/chat");
    void submitMessage(initialPrompt);
  }, [initialPrompt, submitMessage]);

  const sendDecision = useCallback(
    (choice: Exclude<ApprovalChoice, "replied">, action: PendingAction) => {
      if (decisionInFlightRef.current || state.isStreaming) return;
      decisionInFlightRef.current = true;
      dispatch({ type: "DECIDE_START", choice, action });
      void startStream(choice === "approved" ? "yes" : "no", { silent: true });
    },
    [startStream, state.isStreaming]
  );

  const showReloadPause =
    conversationStatus === "interrupted" &&
    !state.statusPendingDismissed &&
    !state.pending &&
    !state.decision &&
    !state.isStreaming &&
    state.messages.length > 0;

  const card = state.decision
    ? {
        action: state.decision.action,
        status: state.decision.status,
        error: state.decision.error,
      }
    : state.pending
      ? { action: state.pending, status: "idle" as ApprovalStatus, error: null }
      : showReloadPause
        ? {
            action: PAUSED_ON_RELOAD,
            status: "idle" as ApprovalStatus,
            error: null,
          }
        : null;

  // Status lines render immediately after the message they followed.
  const resolvedByAnchor = useMemo(() => {
    const map = new Map<string, ResolvedAction[]>();
    for (const item of state.resolved) {
      const key = item.afterMessageId ?? "";
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [state.resolved]);

  const visibleMessages = state.messages.filter((m) => m.role !== "tool");
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
            {(resolvedByAnchor.get("") ?? []).map((item) => (
              <ApprovalStatusLine
                key={item.id}
                action={item.action}
                choice={item.choice}
              />
            ))}

            {visibleMessages.map((message) => (
              <React.Fragment key={message.id}>
                <MessageBubble message={message} />
                {(resolvedByAnchor.get(message.id) ?? []).map((item) => (
                  <ApprovalStatusLine
                    key={item.id}
                    action={item.action}
                    choice={item.choice}
                  />
                ))}
              </React.Fragment>
            ))}

            {state.isStreaming && (
              <StreamingMessage
                content={state.streamingContent}
                activeTool={state.activeTool}
                isThinking={state.isThinking}
              />
            )}

            {card && (
              <ApprovalCard
                action={card.action}
                timezone={timezone}
                timezoneIsFallback={timezoneSource === "fallback"}
                status={card.status}
                error={card.error}
                onDecide={(choice) => sendDecision(choice, card.action)}
                onRetry={
                  state.decision
                    ? () => sendDecision(state.decision!.choice, card.action)
                    : undefined
                }
              />
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
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center animate-aury-fade">
      <div className="flex h-14.5 w-14.5 items-center justify-center rounded-[18px] border border-brand-border bg-brand-soft text-[22px] text-brand-text mb-4.5">
        ✦
      </div>
      <h2 className="text-[26px] font-extrabold tracking-[-0.03em] text-foreground">
        Aurynix Nexus
      </h2>
      <p className="mt-2 text-[14.5px] text-muted-foreground mb-8">
        How can I help your business today?
      </p>

      <div
        className={cn(
          "grid gap-3 w-full max-w-lg",
          SUGGESTED_PROMPTS.length <= 2 ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            className="rounded-[13px] border-border bg-card text-sm h-auto py-3.5 px-4 text-left justify-start font-normal text-muted-foreground transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-brand-border hover:bg-secondary hover:text-foreground"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
