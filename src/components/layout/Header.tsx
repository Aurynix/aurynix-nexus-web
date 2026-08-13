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
  "/app/settings": "Settings",
  "/app/settings/profile": "Profile",
  "/app/settings/security": "Security",
  "/app/settings/integrations": "Integrations",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check prefixes
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix + "/")) return title;
  }
  return "Aurynix Nexus";
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background">
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
        <h1 className="text-sm font-semibold text-foreground">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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
