import { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const metadata: Metadata = {
  title: "Chat",
};

/**
 * `?q=` carries a message typed elsewhere — the dashboard's quick start box —
 * so the conversation opens with it already sent.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialPrompt = Array.isArray(q) ? q[0] : q;

  return <ChatWindow initialPrompt={initialPrompt} />;
}
