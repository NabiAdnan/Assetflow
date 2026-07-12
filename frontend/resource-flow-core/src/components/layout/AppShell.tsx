import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Search, Settings, LogOut, ChevronDown, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { useAuth, roleLabel } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

function getInitials(name?: string, email?: string): string {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group ?? "General")));

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-elegant">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">AssetFlow</div>
          <div className="text-[11px] text-muted-foreground">Enterprise ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group}
            </div>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => (i.group ?? "General") === group).map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="side-active"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-primary-soft border border-primary/10 p-3">
          <div className="text-xs font-medium text-foreground">Need help?</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Explore docs & workflows for your role.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const initials = getInitials(user?.name || user?.full_name, user?.email);

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search assets, employees, requests…"
            className="pl-9 h-10 bg-surface-muted border-transparent focus-visible:border-border focus-visible:bg-surface"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {role && (
          <Badge variant="secondary" className="hidden md:inline-flex h-7 px-2.5 font-medium">
            {roleLabel(role)}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications"
          onClick={() => navigate({ to: "/notifications" })}>
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Settings">
          <Settings className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight pr-1">
                <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                  {user?.name || user?.full_name || user?.email || "Account"}
                </div>
                <div className="text-[11px] text-muted-foreground">{roleLabel(role)}</div>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-semibold">{user?.name || user?.full_name || "Account"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard" })}>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
