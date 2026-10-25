// Client-side DEMO auth for the QuestMaster hackathon frontend.
// The project is frontend-only (see AGENTS.md): no Lovable Cloud, no real
// backend. Accounts and sessions live in this browser's storage so the full
// login/signup/reset/logout flow works in the demo. When the real backend
// ships, swap these functions for its session endpoints.
//
// Demo safety: passwords are NEVER stored in plaintext — only a salted
// SHA-256 hash (with a clearly-marked non-cryptographic fallback for
// non-secure contexts). Sessions carry only a lightweight user identifier.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  name: string;
  email: string;
  title: string;
}

interface StoredAccount {
  name: string;
  email: string;
  passHash: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  /** Sign in as a throwaway guest — no account, session ends with the tab. */
  continueAsDemo: () => void;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

// Preserve context identity across hot updates of this module (same pattern
// as theme-context.tsx) — otherwise mounted consumers lose the provider and
// crash with "useAuth must be used within AuthProvider" after each edit.
const AuthContext = import.meta.hot?.data?.["authContext"] as
  ReturnType<typeof createContext<AuthContextValue | null>> | undefined
  ?? createContext<AuthContextValue | null>(null);

if (import.meta.hot?.data) import.meta.hot.data["authContext"] = AuthContext;

const ACCOUNTS_KEY = "questmaster.accounts";
const SESSION_KEY = "questmaster.session";

// Salted SHA-256 via Web Crypto; falls back to a marked FNV-1a hash where
// crypto.subtle is unavailable (non-secure contexts). Demo-only either way.
export async function hashPassword(password: string): Promise<string> {
  const salted = `questmaster-demo:${password}`;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 0x811c9dc5;
    for (let i = 0; i < salted.length; i++) {
      h ^= salted.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return `fnv1a-${(h >>> 0).toString(16)}`;
  }
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as unknown[];
    // Drop any legacy plaintext-password entries instead of migrating them:
    // demo accounts are disposable, and plaintext must not linger in storage.
    return raw.filter(
      (a): a is StoredAccount =>
        typeof a === "object" && a !== null && typeof (a as StoredAccount).passHash === "string",
    );
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readSession(): AuthUser | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readSession());
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((next: AuthUser | null, remember: boolean) => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (next) {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(SESSION_KEY, JSON.stringify(next));
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      await new Promise((r) => setTimeout(r, 500));
      const passHash = await hashPassword(password);
      const account = readAccounts().find(
        (a) => a.email.toLowerCase() === email.toLowerCase(),
      );
      if (!account || account.passHash !== passHash) {
        throw new Error("Invalid email or password.");
      }
      const next: AuthUser = { name: account.name, email: account.email, title: "Quest Master" };
      persistSession(next, remember);
      setUser(next);
    },
    [persistSession],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await new Promise((r) => setTimeout(r, 600));
      const accounts = readAccounts();
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }
      const passHash = await hashPassword(password);
      accounts.push({ name, email, passHash });
      writeAccounts(accounts);
      const next: AuthUser = { name, email, title: "Quest Master" };
      persistSession(next, true);
      setUser(next);
    },
    [persistSession],
  );

  const continueAsDemo = useCallback(() => {
    const next: AuthUser = {
      name: "Demo Guest",
      email: "guest@demo.questmaster",
      title: "Quest Master",
    };
    // sessionStorage only: the guest session ends when the tab closes.
    persistSession(next, false);
    setUser(next);
  }, [persistSession]);

  const logout = useCallback(() => {
    persistSession(null, false);
    setUser(null);
  }, [persistSession]);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    await new Promise((r) => setTimeout(r, 500));
    const accounts = readAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) {
      throw new Error("No account found with this email.");
    }
    account.passHash = await hashPassword(newPassword);
    writeAccounts(accounts);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        continueAsDemo,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
