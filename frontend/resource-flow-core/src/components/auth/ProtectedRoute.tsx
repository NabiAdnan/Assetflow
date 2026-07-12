import { Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";

export function ProtectedRouteLayout() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-3 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
