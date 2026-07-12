import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TOKEN_KEY } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem(TOKEN_KEY);
      if (t) {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — AssetFlow" },
      { name: "description", content: "Sign in to your AssetFlow enterprise workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left illustrative panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary-soft via-background to-background border-r border-border">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-[28rem] rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-elevated">
              <Sparkles className="size-4.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">AssetFlow</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md space-y-4"
          >
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Enterprise asset & resource management, elegantly unified.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track assets, coordinate allocations, and orchestrate maintenance,
              transfers, and audits across your organization — from a single calm workspace.
            </p>
            <div className="pt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              {["Assets", "Allocations", "Transfers", "Bookings", "Maintenance", "Audits"].map((k) => (
                <div key={k} className="rounded-md border border-border/70 bg-surface/60 px-2.5 py-2 text-center backdrop-blur-sm">
                  {k}
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AssetFlow</p>
        </div>
      </div>

      {/* Right auth card */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex items-center gap-2.5 justify-center">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <Sparkles className="size-4.5" />
            </div>
            <span className="text-base font-semibold">AssetFlow</span>
          </div>

          <div className="glass-panel rounded-2xl p-8 shadow-elevated">
            <div className="space-y-1.5 mb-7">
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to continue to your workspace.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/auth/login" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Remember me on this device
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive animate-fade-in">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-1">
                Don't have an account?{" "}
                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                  Request access
                </Link>
              </p>
              <p className="text-[11px] text-center text-muted-foreground">
                Roles are assigned by your administrator.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
