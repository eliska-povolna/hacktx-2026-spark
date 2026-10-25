import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scroll } from "lucide-react";
import { toast } from "sonner";

import { getRuns } from "@/api/client";
import type { RunSummary } from "@/api/types";
import { THEME_COPY, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Chronicles — QuestMaster" },
      { name: "description", content: "Reports and insights from past QuestMaster quest runs." },
      { property: "og:title", content: "Chronicles — QuestMaster" },
      { property: "og:description", content: "Reports and insights from past quest runs." },
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

  useEffect(() => {
    getRuns().then(setRuns).catch(() => toast.error("Could not load reports."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.reportsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.reportsSub}</p>

      <div className="parchment-panel mt-6 overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gold-dim/50 text-left font-display text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2">Quest</th>
              <th className="px-3 py-2">Party</th>
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
                    <span className="font-semibold">{run.goal}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-ink-soft">{run.team_name}</td>
                <td className="px-3 py-3 text-ink-soft">{run.date}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "font-semibold",
                      run.status === "COMPLETED" ? "text-forest" : "text-crimson",
                    )}
                  >
                    {run.result}
                  </span>
                </td>
                <td className="px-3 py-3 text-ink-soft">{(run.duration_ms / 1000).toFixed(1)}s</td>
                <td className="px-3 py-3 font-semibold">${run.estimated_ai_cost_usd.toFixed(2)}</td>
                <td className="px-3 py-3 font-semibold text-forest">{run.llm_calls_avoided}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
