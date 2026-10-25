import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scroll } from "lucide-react";
import { toast } from "sonner";

import { getRuns, isMockMode } from "@/api/client";
import { formatDate, formatDuration, formatMoney, humanize } from "@/lib/result-format";
import type { RunSummary } from "@/api/types";
import { adaptMockText, THEME_COPY, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — QuestMaster" },
      { name: "description", content: "Reports and insights from past QuestMaster runs." },
      { property: "og:title", content: "Reports — QuestMaster" },
      { property: "og:description", content: "Reports and insights from past runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getRuns().then(setRuns).catch(() => { setError(true); toast.error("Could not load reports."); }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.reportsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.reportsSub}</p>

      {loading && <p role="status" className="mt-6 text-muted-foreground">Loading reports...</p>}
      {error && <p role="alert" className="mt-6 text-destructive">Reports are unavailable. Please try again later.</p>}
      {!loading && !error && runs.length === 0 && <p className="mt-6 text-muted-foreground">No historical runs yet.</p>}
      {runs.length > 0 && <div className="parchment-panel mt-6 overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gold-dim/50 text-left font-display text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2">{copy.reportGoalCol}</th>
              <th className="px-3 py-2">{copy.reportTeamCol}</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">AI Cost</th>
              <th className="px-3 py-2">AI Calls Avoided</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.run_id} className="border-b border-gold-dim/25 text-ink last:border-0">
                <td className="max-w-64 px-3 py-3">
                  <div className="flex items-start gap-2">
                    <Scroll className="mt-0.5 h-4 w-4 shrink-0 text-gold-dim" />
                    <span className="font-semibold">{isMockMode() ? adaptMockText(theme, run.goal) : run.goal || "Unavailable"}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-soft">{isMockMode() ? adaptMockText(theme, run.team_name) : run.team_name || "Unavailable"}</td>
                <td className="px-3 py-3 text-ink-soft">{formatDate(run.date)}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "font-semibold",
                      run.status === "COMPLETED" ? "text-forest" : "text-crimson",
                    )}
                  >
                    {humanize(run.result || run.status)}
                  </span>
                </td>
                <td className="px-3 py-3 text-ink-soft">{formatDuration(run.duration_ms)}</td>
                <td className="px-3 py-3 font-semibold">{formatMoney(run.estimated_ai_cost_usd)}</td>
                <td className="px-3 py-3 font-semibold text-forest">{run.llm_calls_avoided ?? "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      <p className="mt-2 text-right text-[11px] italic text-muted-foreground sm:hidden">
        Swipe to view more →
      </p>
    </div>
  );
}
