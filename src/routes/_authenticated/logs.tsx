import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import { getLogEvents } from "@/api/client";
import type { LogEvent } from "@/api/types";
import { THEME_COPY, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({
    meta: [
      { title: "Activity — QuestMaster" },
      { name: "description", content: "Activity and execution logs across all QuestMaster runs." },
      { property: "og:title", content: "Activity — QuestMaster" },
      { property: "og:description", content: "Activity and execution logs across all runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogsPage,
});

const FILTERS = ["All", "CODE", "TOOL", "LLM", "Security"] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORY_STYLES: Record<LogEvent["category"], string> = {
  QUEST: "bg-[oklch(0.72_0.12_85)] text-[oklch(0.18_0.03_60)]",
  PARTY: "bg-[oklch(0.6_0.12_80)] text-[oklch(0.18_0.03_60)]",
  CODE: "bg-[oklch(0.5_0.14_150)] text-white",
  TOOL: "bg-[oklch(0.55_0.12_210)] text-white",
  LLM: "bg-[oklch(0.55_0.18_300)] text-white",
  SECURITY: "bg-[oklch(0.5_0.16_25)] text-white",
};

function LogsPage() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    getLogEvents().then(setEvents).catch(() => toast.error("Could not load the activity log."));
  }, []);

  const visible = useMemo(() => {
    if (filter === "All") return events;
    if (filter === "Security") return events.filter((e) => e.category === "SECURITY");
    return events.filter((e) => e.category === filter);
  }, [events, filter]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.logsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.logsSub}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filter === f
                ? "border-arcane-bright bg-arcane/40 text-foreground"
                : "border-gold-dim/50 text-muted-foreground hover:text-gold",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="parchment-panel mt-4 p-4 sm:p-5">
        <ul className="space-y-2.5">
          {visible.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <BookOpen className="h-4 w-4 shrink-0 text-gold-dim" />
              <span className="shrink-0 font-mono text-[11px] text-ink-soft sm:w-36">
                {event.timestamp}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider sm:order-last",
                  CATEGORY_STYLES[event.category],
                )}
              >
                {event.category}
              </span>
              <span className="w-full min-w-0 text-ink sm:w-auto sm:flex-1">
                {event.message}
                <span className="ml-1.5 text-xs italic text-ink-soft">— {event.actor}</span>
              </span>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="py-6 text-center text-sm italic text-ink-soft">
              {copy.logsEmpty}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
