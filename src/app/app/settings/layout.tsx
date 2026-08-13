"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Profile", href: "/app/settings/profile" },
  { label: "Security", href: "/app/settings/security" },
  { label: "Integrations", href: "/app/settings/integrations" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar nav */}
        <aside className="hidden md:flex flex-col w-48 flex-shrink-0 border-r border-border px-3 py-4 gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-8 items-center rounded px-3 text-sm transition-colors",
                pathname === item.href
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-auto">
          {/* Mobile tab nav */}
          <div className="md:hidden flex border-b border-border px-4 gap-0 flex-shrink-0 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm border-b-2 transition-colors -mb-px whitespace-nowrap",
                  pathname === item.href
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
