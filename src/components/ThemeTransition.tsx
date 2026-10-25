import { useEffect, useRef, useState } from "react";

import { useTheme, type AppTheme } from "@/lib/theme-context";

const TRANSITION_MS = 900;

/**
 * Brief full-screen effect played when the interface style changes. The
 * effect matches the theme being switched TO (gold arcane burst for Fantasy,
 * a clean light sweep for Professional, red speed streaks for Toyota).
 * Purely decorative: pointer-events are untouched and reduced-motion users
 * get no animation (see styles.css).
 */
export function ThemeTransition() {
  const { theme } = useTheme();
  const [active, setActive] = useState<AppTheme | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    // Skip the initial mount — only animate actual switches.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setActive(theme);
    const timer = window.setTimeout(() => setActive(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [theme]);

  if (!active) return null;

  return <div className={`theme-transition theme-transition--${active}`} aria-hidden="true" />;
}
