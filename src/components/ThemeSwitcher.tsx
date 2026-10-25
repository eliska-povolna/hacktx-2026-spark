import { THEME_OPTIONS, useTheme, type AppTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground",
          compact ? "mb-1.5" : "mb-2",
        )}
      >
        Interface Style
      </div>
      <div className="flex gap-1 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-1">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value as AppTheme)}
            aria-pressed={theme === option.value}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors",
              theme === option.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
