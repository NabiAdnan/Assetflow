import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, TOKEN_KEY, USER_KEY, extractApiError } from "./api";

export type UserRole = "admin" | "asset_manager" | "department_head" | "employee" | string;

export interface AuthUser {
  id?: string | number;
  email?: string;
  name?: string;
  full_name?: string;
  username?: string;
  role?: UserRole;
  roles?: UserRole[];
  avatar_url?: string;
  department?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate after mount to avoid SSR mismatch
  useEffect(() => {
    const t = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    const u = readStorage<AuthUser>(USER_KEY);
    setToken(t);
    setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // FastAPI OAuth2PasswordRequestForm-compatible + JSON fallback
    let data: { access_token: string; token_type?: string; user?: AuthUser } | null = null;
    try {
      const form = new URLSearchParams();
      form.set("username", email);
      form.set("password", password);
      const res = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      data = res.data;
    } catch (err) {
      // Retry with JSON body if backend expects JSON
      try {
        const res = await api.post("/auth/login", { email, password });
        data = res.data;
      } catch {
        throw new Error(extractApiError(err, "Invalid email or password"));
      }
    }
    if (!data?.access_token) throw new Error("Login failed: no token returned");
    window.localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);

    let nextUser: AuthUser | null = data.user ?? null;
    if (!nextUser) {
      try {
        const me = await api.get("/auth/me");
        nextUser = me.data;
      } catch {
        nextUser = { email };
      }
    }
    if (nextUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") window.location.assign("/auth/login");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me.data);
      window.localStorage.setItem(USER_KEY, JSON.stringify(me.data));
    } catch {
      /* noop */
    }
  }, []);

  const role: UserRole | null = useMemo(() => {
    if (!user) return null;
    if (user.role) return user.role;
    if (Array.isArray(user.roles) && user.roles.length) return user.roles[0];
    return null;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loading,
      role,
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading, role, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleLabel(role?: UserRole | null): string {
  if (!role) return "Member";
  const map: Record<string, string> = {
    admin: "Administrator",
    asset_manager: "Asset Manager",
    department_head: "Department Head",
    employee: "Employee",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
