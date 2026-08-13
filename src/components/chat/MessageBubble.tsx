"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageResponse } from "@/types/conversation";

interface MessageBubbleProps {
  message: MessageResponse;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  if (isTool) return null; // Tool messages not shown directly

  return (
    <div
      className={cn(
        "group flex gap-3 py-4 px-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-bold text-primary-foreground">N</span>
        </div>
      )}

      <div className={cn("max-w-[75%]", isUser && "max-w-[65%]")}>
        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="prose text-sm text-foreground leading-relaxed break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
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
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground">U</span>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const codeEl = document.querySelector("code");
    const text = codeEl?.textContent ?? "";
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code rounded-md overflow-hidden border border-border bg-muted">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center gap-1 rounded bg-background border border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 text-sm">{children}</pre>
    </div>
  );
}
