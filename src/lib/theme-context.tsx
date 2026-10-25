import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type AppTheme = "fantasy" | "professional" | "toyota";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const THEME_KEY = "questmaster.theme";

export function readTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "professional" || raw === "toyota" ? raw : "fantasy";
  } catch {
    return "fantasy";
  }
}

// Preserve context identity even if this module itself is hot-reloaded.
const ThemeContext = import.meta.hot?.data?.["themeContext"] as
  ReturnType<typeof createContext<ThemeContextValue | null>> | undefined
  ?? createContext<ThemeContextValue | null>(null);

if (import.meta.hot?.data) import.meta.hot.data["themeContext"] = ThemeContext;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("fantasy");
  useEffect(() => { setThemeState(readTheme()); }, []);
  useEffect(() => { document.documentElement.dataset["theme"] = theme; }, [theme]);

  const setTheme = useCallback((next: AppTheme) => {
    try { localStorage.setItem(THEME_KEY, next); } catch { /* Session-only when storage is unavailable. */ }
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}