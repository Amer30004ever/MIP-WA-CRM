"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox":     "Inbox",
  "/leads":     "Leads",
  "/contacts":  "Contacts",
  "/companies": "Companies",
  "/deals":     "Deals",
  "/tasks":     "Tasks",
  "/templates": "Templates",
  "/settings":  "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const pageLabel =
    Object.entries(routeLabels).find(([route]) =>
      pathname.startsWith(route)
    )?.[1] ?? "MaVoid";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">MaVoid</span>
        <ChevronDown className="h-3 w-3 rotate-[-90deg] text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{pageLabel}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          id="topbar-notifications"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {user?.name ?? "User"}
          </span>
          <button
            id="topbar-logout"
            onClick={logout}
            className="ml-1 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
