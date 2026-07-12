import { createFileRoute, redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/api";
import { ProtectedRouteLayout } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem(TOKEN_KEY);
      if (!t) {
        throw redirect({ to: "/auth/login" });
      }
    }
  },
  component: ProtectedRouteLayout,
});
