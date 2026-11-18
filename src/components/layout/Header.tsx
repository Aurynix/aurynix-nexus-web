"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/app": "Dashboard",
  "/app/chat": "Chat",
  "/app/conversations": "Conversations",
  "/app/documents": "Documents",
  "/app/memory": "Memory",
  "/app/contact-groups": "Contact groups",
  "/app/settings": "Settings",
  "/app/settings/profile": "Profile",
  "/app/settings/security": "Security",
  "/app/settings/integrations": "Integrations",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Then the *longest* matching prefix — "/app" is a prefix of every route,
  // so matching in declaration order would label every sub-page "Dashboard".
  let best: string | null = null;
  let bestLength = 0;
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix + "/") && prefix.length > bestLength) {
      best = title;
      bestLength = prefix.length;
    }
  }
  return best ?? "Aurynix Nexus";
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-5 h-15 flex items-center justify-between px-4 md:px-7 border-b border-border bg-background/85 backdrop-blur-[10px]">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-[14.5px] font-bold tracking-tight text-foreground">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
