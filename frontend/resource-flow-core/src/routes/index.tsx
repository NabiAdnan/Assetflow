import { createFileRoute, redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/api";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem(TOKEN_KEY);
      throw redirect({ to: t ? "/dashboard" : "/auth/login" });
    }
  },
  component: () => null,
});
