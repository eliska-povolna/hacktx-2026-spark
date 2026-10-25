// Client-side auth for the QuestMaster hackathon frontend.
// The project is frontend-only (see AGENTS.md): no Lovable Cloud, no real
// backend. Accounts and sessions live in localStorage so the full
// login/signup/reset/logout flow works in the demo. When the real backend
// ships, swap these functions for its session endpoints.

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
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCOUNTS_KEY = "questmaster.accounts";
const SESSION_KEY = "questmaster.session";

function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as StoredAccount[];
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
      const account = readAccounts().find(
        (a) => a.email.toLowerCase() === email.toLowerCase(),
      );
      if (!account || account.password !== password) {
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
      accounts.push({ name, email, password });
      writeAccounts(accounts);
      const next: AuthUser = { name, email, title: "Quest Master" };
      persistSession(next, true);
      setUser(next);
    },
    [persistSession],
  );

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
    account.password = newPassword;
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
