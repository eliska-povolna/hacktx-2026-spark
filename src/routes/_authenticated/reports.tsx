import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Scroll, X } from "lucide-react";
import { toast } from "sonner";

import { getRun, getRuns, isMockMode } from "@/api/client";
import type { Run, RunSummary } from "@/api/types";
import { RunDetails } from "@/components/RunDetails";
import { formatDate, formatDuration, formatMoney, humanize } from "@/lib/result-format";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Run | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getRuns()
      .then(setRuns)
      .catch(() => {
        setError(true);
        toast.error("Could not load reports.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    getRun(selectedId)
      .then((run) => {
        if (active) setDetail(run);
      })
      .catch(() => {
        if (active) {
          setDetail(null);
          toast.error("Could not load that run.");
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.reportsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.reportsSub}</p>
      <p className="mt-2 text-xs text-ink-soft">Click a row to reopen the full run result (recommendation, outputs, tasks).</p>

      {loading && (
        <p role="status" className="mt-6 text-muted-foreground">
          Loading reports...
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 text-destructive">
          Reports are unavailable. Please try again later.
        </p>
      )}
      {!loading && !error && runs.length === 0 && (
        <p className="mt-6 text-muted-foreground">No historical runs yet.</p>
      )}
      {runs.length > 0 && (
        <div className="parchment-panel mt-6 overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gold-dim/50 text-left font-display text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2">{copy.reportGoalCol}</th>
                <th className="px-3 py-2">{copy.reportTeamCol}</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">AI cost</th>
                <th className="px-3 py-2">LLM calls</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const active = selectedId === run.run_id;
                return (
                  <tr
                    key={run.run_id}
                    tabIndex={0}
                    aria-selected={active}
                    onClick={() => setSelectedId(run.run_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(run.run_id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-b border-gold-dim/25 text-ink last:border-0 hover:bg-gold-dim/10",
                      active && "bg-gold-dim/15",
                    )}
                  >
                    <td className="max-w-64 px-3 py-3">
                      <div className="flex items-start gap-2">
                        <Scroll className="mt-0.5 h-4 w-4 shrink-0 text-gold-dim" />
                        <span className="font-semibold">
                          {isMockMode() ? adaptMockText(theme, run.goal) : run.goal || "Unavailable"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">
                      {isMockMode() ? adaptMockText(theme, run.team_name) : run.team_name || "Unavailable"}
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{formatDate(run.date, true)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "font-semibold",
                          run.status === "COMPLETED" || run.status === "NO_ACTION_NEEDED"
                            ? "text-forest"
                            : run.status === "FAILED" || run.status === "BUDGET_LIMIT"
                              ? "text-crimson"
                              : "text-ink-soft",
                        )}
                      >
                        {humanize(run.status)}
                      </span>
                      {run.result && run.result !== run.status && (
                        <p className="mt-0.5 text-xs text-ink-soft">{humanize(run.result)}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{formatDuration(run.duration_ms)}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(run.estimated_ai_cost_usd)}</td>
                    <td className="px-3 py-3 font-semibold">{run.llm_calls ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-right text-[11px] italic text-muted-foreground sm:hidden">Swipe to view more →</p>

      {selectedId && (
        <section className="parchment-panel mt-6 p-4 sm:p-5" aria-label="Selected run details">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="gold-heading text-xl font-bold">Run detail</h2>
              <p className="font-mono text-xs text-ink-soft">{selectedId}</p>
            </div>
            <button
              type="button"
              className="btn-outline-gold inline-flex items-center gap-1 px-3 py-1.5 text-xs !text-ink"
              onClick={() => setSelectedId(null)}
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          {detailLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading run…
            </p>
          )}
          {!detailLoading && detail && (
            <RunDetails
              run={detail}
              toyota={Boolean(detail.recommendation || detail.financial_context || detail.portfolio_result)}
              showNessie={Boolean(detail.financial_context)}
            />
          )}
          {!detailLoading && !detail && (
            <p className="text-sm text-destructive">This run could not be restored.</p>
          )}
        </section>
      )}
    </div>
  );
}
