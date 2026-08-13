"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

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
              Using <span className="font-mono">{activeTool}</span>…
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
