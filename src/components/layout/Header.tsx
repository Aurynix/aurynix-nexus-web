"use client";

import { usePathname } from "next/navigation";
import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

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
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-[9px] border border-border text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
