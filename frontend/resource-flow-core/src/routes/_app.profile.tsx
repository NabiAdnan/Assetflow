import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, UserCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, roleLabel } from "@/lib/auth";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AssetFlow" },
      { name: "description", content: "View your user profile and account details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const displayName = user?.name || user?.full_name || user?.email || "Account";
  const initials = (displayName || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Profile</h1>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
        </Button>
      </div>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </div>
              <div>
                <CardTitle className="text-xl">{displayName}</CardTitle>
                <CardDescription>{user?.email || "No email available"}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {roleLabel(role)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-sm font-semibold text-foreground">Account details</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Role:</span> {roleLabel(role)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Department:</span> {user?.department || "Not assigned"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Status:</span> Active
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Quick access</p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Review your assigned assets, maintenance requests, and approvals from one place.</p>
                <p>Use the dashboard to jump back into recent activity.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="default" onClick={() => navigate({ to: "/dashboard" })}>
              Go to dashboard
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
