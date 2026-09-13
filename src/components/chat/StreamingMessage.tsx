"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Tool names come off the wire as raw identifiers. Showing "send_email" to a
 * user is worse than showing what it's actually doing, so map the known ones
 * and fall back to de-snake-casing anything new the backend adds.
 */
const TOOL_LABELS: Record<string, string> = {
  knowledge_base_search: "Searching your documents",
  document_search: "Searching your documents",
  memory_search: "Recalling what I know about you",
  memory_write: "Updating memory",
  web_search: "Searching the web",
  send_email: "Preparing an email",
  read_email: "Reading your inbox",
  search_email: "Searching your inbox",
  create_calendar_event: "Adding a calendar event",
  update_calendar_event: "Updating a calendar event",
  delete_calendar_event: "Removing a calendar event",
  list_calendar_events: "Checking your calendar",
  get_weather: "Checking the weather",
  current_weather: "Checking the weather",
  weather_forecast: "Checking the forecast",
  get_forecast: "Checking the forecast",
  list_contact_groups: "Looking up your contact groups",
  get_contact_group: "Looking up a contact group",
  resolve_contact_group: "Expanding a contact group",
  expand_contact_group: "Expanding a contact group",
  create_contact_group: "Saving a contact group",
  update_contact_group: "Updating a contact group",
  delete_contact_group: "Removing a contact group",
};

function formatToolName(tool: string): string {
  const known = TOOL_LABELS[tool];
  if (known) return known;
  const words = tool.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface StreamingMessageProps {
  content: string;
  activeTool: string | null;
  isThinking: boolean;
}

export function StreamingMessage({
  content,
  activeTool,
  isThinking,
}: StreamingMessageProps) {
  const showCursor = !content || content.length === 0;

  return (
    <div className="flex gap-3 py-4 px-4">
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-[10px] font-bold text-primary-foreground">N</span>
      </div>

      <div className="flex-1 min-w-0">
        {activeTool && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatToolName(activeTool)}…
            </span>
          </div>
        )}

        {isThinking && !content && !activeTool && (
          <div className="flex items-center gap-1 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
          </div>
        )}

        {content && (
          <div className="prose text-sm text-foreground leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="bg-muted border border-border rounded px-1 py-0.5 text-[0.8em] font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={cn(className, "text-sm")} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {showCursor && (
              <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}

        {content && (
          <span className="inline-block w-0.5 h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    </div>
  );
}
