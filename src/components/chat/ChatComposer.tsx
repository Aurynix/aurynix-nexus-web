"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Ask anything about your business…",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && value.trim()) {
          onSubmit();
        }
      }
    },
    [isStreaming, value, onSubmit]
  );

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="relative flex items-end gap-2 rounded-xl border border-input bg-background shadow-xs focus-within:ring-1 focus-within:ring-ring transition-all px-3 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-[200px] py-0.5",
            (disabled || isStreaming) && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Chat message"
        />

        <div className="flex-shrink-0">
          {isStreaming ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={onStop}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Stop generation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={onSubmit}
              disabled={!value.trim() || disabled}
              className="h-7 w-7"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2 hidden sm:block">
        Press{" "}
        <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">
          Enter
        </kbd>{" "}
        to send,{" "}
        <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">
          Shift+Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
}
