"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  FileText,
  Brain,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutDashboard,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard, exact: true },
  { label: "Chat", href: "/app/chat", icon: MessageSquare },
  { label: "Conversations", href: "/app/conversations", icon: MessagesSquare },
  { label: "Documents", href: "/app/documents", icon: FileText },
  { label: "Memory", href: "/app/memory", icon: Brain },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleNewChat = () => {
    router.push("/app/chat");
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-14" : "w-62"
        )}
      >
        {/* Logo + collapse button */}
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "flex-col gap-2 px-2 py-3" : "h-15 px-4.5 justify-between"
          )}
        >
          {!collapsed && (
            <Link href="/app" className="flex items-center gap-2.5 min-w-0">
              <div className="aury-mark h-6.5 w-6.5 rounded-lg flex-shrink-0" />
              <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">
                Aurynix Nexus
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/app">
              <div className="aury-mark h-6.5 w-6.5 rounded-lg" />
            </Link>
          )}
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="flex h-6 w-6 items-center justify-center rounded text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* New Chat button */}
        <div className={cn("px-3.5 pt-4 pb-2.5", collapsed && "flex justify-center px-2 py-3")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="aury-btn-soft h-8 w-8"
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="aury-btn-soft w-full justify-start gap-2 text-sm h-10 font-semibold"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              New chat
            </Button>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-9 w-full items-center justify-center rounded-[9px] text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9.5 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold ring-1 ring-inset ring-brand-border"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text" />
                )}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* Settings + User */}
        <div className={cn("px-2.5 py-2.5 space-y-0.5")}>
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/app/settings"
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-[9px] text-sm transition-colors",
                      pathname.startsWith("/app/settings")
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="flex h-9 w-full items-center justify-center rounded-[9px] text-sm text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link
                href="/app/settings"
                className={cn(
                  "flex h-9.5 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-sm transition-colors",
                  pathname.startsWith("/app/settings")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold ring-1 ring-inset ring-brand-border"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                Settings
              </Link>

              {/* User row */}
              <div className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 mt-1">
                <Avatar className="h-7.5 w-7.5 flex-shrink-0">
                  <AvatarFallback className="aury-avatar text-[11px] font-extrabold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-sidebar-muted-foreground truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="text-sidebar-muted-foreground hover:text-sidebar-foreground transition-colors flex-shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
