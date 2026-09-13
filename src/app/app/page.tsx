"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, FileText, Brain, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useDocuments } from "@/hooks/useDocuments";
import { useMemory } from "@/hooks/useMemory";
import { getConversationTitle, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: memoryFacts, isLoading: memoryLoading } = useMemory();

  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const username = user?.email ? user.email.split("@")[0] : "";
  const greeting = getTimeGreeting();

  const recentConversations = conversations?.slice(0, 5) ?? [];

  const handlePromptKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && prompt.trim()) {
      router.push("/app/chat");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-11 pb-16 space-y-9 animate-aury-fade">
        {/* Welcome section */}
        <section>
          <p className="aury-eyebrow text-brand-text">{greeting}</p>
          <h1 className="aury-heading-gradient mt-3 text-[38px] leading-[1.1] font-extrabold tracking-[-0.035em]">
            {username || "Welcome back"}
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">
            What would you like to accomplish today?
          </p>
          <div className="pt-6">
            <Button asChild className="aury-btn-primary h-11 px-5 text-[14.5px] font-bold">
              <Link href="/app/chat">
                <Plus className="h-4 w-4 mr-1" />
                Start new conversation
              </Link>
            </Button>
          </div>
        </section>

        {/* Quick stats */}
        <section>
          <h2 className="aury-eyebrow mb-3.5">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Conversations stat */}
            <div className="aury-surface aury-surface-hover rounded-2xl p-4.5">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] border"
                  style={{ background: "#8f80ff20", borderColor: "#8f80ff45", color: "#8f80ff" }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-muted-foreground">
                  Conversations
                </span>
              </div>
              {convsLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <p className="text-[30px] font-extrabold tracking-[-0.03em] text-foreground">
                  {conversations?.length ?? 0}
                </p>
              )}
            </div>

            {/* Documents stat */}
            <div className="aury-surface aury-surface-hover rounded-2xl p-4.5">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] border"
                  style={{ background: "#5eb8f520", borderColor: "#5eb8f545", color: "#5eb8f5" }}
                >
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-muted-foreground">
                  Documents
                </span>
              </div>
              {docsLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <p className="text-[30px] font-extrabold tracking-[-0.03em] text-foreground">
                  {documents?.total ?? 0}
                </p>
              )}
            </div>

            {/* Memory stat */}
            <div className="aury-surface aury-surface-hover rounded-2xl p-4.5">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] border"
                  style={{ background: "#7ad6b420", borderColor: "#7ad6b445", color: "#7ad6b4" }}
                >
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-muted-foreground">
                  Memory facts
                </span>
              </div>
              {memoryLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <p className="text-[30px] font-extrabold tracking-[-0.03em] text-foreground">
                  {memoryFacts?.length ?? 0}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Recent conversations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="aury-eyebrow">Recent conversations</h2>
            {conversations && conversations.length > 0 && (
              <Link
                href="/app/conversations"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {convsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <Skeleton className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="aury-empty-panel flex flex-col items-center rounded-2xl px-5 py-11 text-center">
              <div className="animate-aury-pulse flex h-14 w-14 items-center justify-center rounded-[18px] border border-brand-border bg-brand-soft text-xl text-brand-text">
                ✦
              </div>
              <p className="mt-4 text-[15px] font-bold text-foreground">
                No conversations yet
              </p>
              <p className="mt-1.5 max-w-70 text-[13.5px] leading-relaxed text-muted-foreground">
                Ask Aurynix anything about your business — your threads will show
                up here.
              </p>
              <Button asChild className="aury-btn-soft mt-4 h-9.5 px-4 text-[13.5px] font-semibold">
                <Link href="/app/chat">
                  <Plus className="h-4 w-4 mr-1" />
                  Start chatting
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/app/chat/${conv.id}`}
                  className="aury-surface aury-surface-hover flex items-center gap-3 rounded-2xl px-4.5 py-3.5"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getConversationTitle(conv.title, [], "New conversation")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(conv.updated_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick chat prompt */}
        <section>
          <h2 className="aury-eyebrow mb-3.5">Quick start</h2>
          <div className="aury-surface rounded-2xl p-4.5 space-y-3">
            <p className="text-[13.5px] text-muted-foreground">
              Type a message and press Enter to start a new conversation.
            </p>
            <Input
              ref={inputRef}
              placeholder="Ask anything…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handlePromptKeyDown}
              className="h-11 bg-muted/40"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
