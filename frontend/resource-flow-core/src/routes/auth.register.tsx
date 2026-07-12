import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { api, extractApiError, TOKEN_KEY } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
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
      { title: "Request Access — AssetFlow" },
      { name: "description", content: "Create an account to access the AssetFlow workspace." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password: password,
      });
      toast.success("Account registered successfully! You can now log in.");
      navigate({ to: "/auth/login" });
    } catch (err) {
      setError(extractApiError(err, "Registration failed"));
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
              <h2 className="text-2xl font-semibold tracking-tight">Request Access</h2>
              <p className="text-sm text-muted-foreground">
                Create an account to join your enterprise workspace.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
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
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive animate-fade-in">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Registering…
                  </>
                ) : (
                  "Register"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-1">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
