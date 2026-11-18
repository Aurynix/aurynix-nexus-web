"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Switches between light and dark. The app follows the device until this is
 * clicked, and switching back to what the device already shows clears the
 * saved choice, so it goes back to following the device.
 */
export function ThemeToggle({ label = "Toggle theme" }: { label?: string }) {
  const { resolvedTheme, systemTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next === systemTheme ? "system" : next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-[9px] border border-border text-muted-foreground hover:text-foreground"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {/* Both icons render and CSS picks one, so the server and client agree. */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
