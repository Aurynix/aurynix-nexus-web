import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aurynix Nexus",
    template: "%s — Aurynix Nexus",
  },
  description:
    "AI-powered business assistant platform built with LangGraph, RAG, Memory, and Multi-Agent workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body suppressHydrationWarning className="h-full bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
