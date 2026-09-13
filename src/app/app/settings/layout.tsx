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
      <div className="border-b border-border px-6 py-5 flex-shrink-0">
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-foreground">
          Settings
        </h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Manage your account, security and connected tools.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar nav */}
        <aside className="hidden md:flex flex-col w-48 flex-shrink-0 border-r border-border px-3 py-4 gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-9.5 items-center rounded-[9px] px-3.5 text-[13.5px] transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground font-bold ring-1 ring-inset ring-brand-border"
                  : "font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                    ? "border-brand text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex-1 overflow-auto px-6 py-6">
            {children}

            {/* Roadmap notice */}
            <div className="mt-6 flex items-start gap-3.5 rounded-[14px] border border-brand-border bg-[linear-gradient(100deg,var(--brand-soft),transparent)] px-4.5 py-4">
              <div className="flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-[9px] bg-brand-soft text-[13px] text-brand-text">
                ✦
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-foreground">
                  More controls are on the way
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Team workspaces, granular permissions and audit logs are coming
                  to Nexus soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
