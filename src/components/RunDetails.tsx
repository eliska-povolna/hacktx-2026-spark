import type { Run } from "@/api/types";
import { ExecutorBadge } from "@/components/ExecutorBadge";
import { formatMoney, humanize } from "@/lib/result-format";
import { cn } from "@/lib/utils";

export function RunDetails({ run, toyota }: { run: Run; toyota: boolean }) {
  const recommendation = run.recommendation;
  const financial = run.financial_context;
  const evaluators = run.evaluators ?? [];
  const passed = evaluators.filter((item) => item.status === "PASS").length;
  return (
    <div className="space-y-6">
      {toyota && recommendation && (
        <>
          <section>
            <h2 className="gold-heading text-xl font-bold">Compare your options</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recommended: {humanize(recommendation.recommended_action)}</p>
            {recommendation.options?.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recommendation.options.map((option, index) => (
                <article key={option.id ?? index} className="parchment-panel min-w-0 p-4">
                  <h3 className="font-display font-bold text-ink">{option.label}</h3>
                  <dl className="mt-3 space-y-2 text-sm text-ink-soft">
                    <div><dt>Monthly cost</dt><dd className="font-semibold text-ink">{formatMoney(option.monthly_cost)}</dd></div>
                    <div><dt>3-year cost</dt><dd className="font-semibold text-ink">{formatMoney(option.three_year_cost)}</dd></div>
                    <div><dt>Fit score</dt><dd>{typeof option.fit_score === "number" && Number.isFinite(option.fit_score) ? `${option.fit_score}/100` : "Unavailable"}</dd></div>
                    <div><dt>Budget safety</dt><dd className={cn("font-semibold", option.safe_for_budget === true ? "text-forest" : option.safe_for_budget === false ? "text-destructive" : "text-ink-soft")}>{option.safe_for_budget === true ? "Within safe budget" : option.safe_for_budget === false ? "Exceeds safe budget" : "Unavailable"}</dd></div>
                  </dl>
                  <ul className="mt-3 space-y-1 text-xs text-ink-soft">{option.tradeoffs?.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul>
                </article>
              ))}
            </div> : <p className="mt-2 text-sm text-muted-foreground">Option comparison is unavailable for this run.</p>}
          </section>
          {financial && <section>
            <h2 className="gold-heading text-xl font-bold">Financial context</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
              <div><dt className="text-muted-foreground">Financial stress</dt><dd className="mt-1 font-semibold">{humanize(financial.financial_stress)}</dd></div>
              <div><dt className="text-muted-foreground">Safe mobility budget / month</dt><dd className="mt-1 font-semibold">{formatMoney(financial.safe_mobility_budget)}</dd></div>
              <div><dt className="text-muted-foreground">Emergency runway</dt><dd className="mt-1 font-semibold">{typeof financial.emergency_runway_months === "number" && Number.isFinite(financial.emergency_runway_months) ? `${financial.emergency_runway_months.toFixed(1)} months` : "Unavailable"}</dd></div>
              <div><dt className="text-muted-foreground">Free cash flow / month</dt><dd className="mt-1 font-semibold">{formatMoney(financial.monthly_free_cashflow)}</dd></div>
              <div><dt className="text-muted-foreground">Cash reserve</dt><dd className="mt-1 font-semibold">{formatMoney(financial.cash_reserve)}</dd></div>
            </dl>
          </section>}
          {recommendation.next_step && <section className="border-l-2 border-gold-dim pl-4">
            <h2 className="gold-heading text-lg font-bold">Recommended next step</h2>
            <p className="mt-1 font-semibold">{recommendation.next_step.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">Suggested follow-up only — no application or contract action has been submitted.</p>
          </section>}
          {!!recommendation.assumptions?.length && <section>
            <h2 className="gold-heading font-bold">Assumptions</h2>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{recommendation.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
          </section>}
        </>
      )}
      {run.status === "COMPLETED" && <section>
        <h2 className="gold-heading text-xl font-bold">Quality checks{evaluators.length ? ` — ${passed}/${evaluators.length} passed` : ""}</h2>
        {evaluators.length ? <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {evaluators.map((item, index) => <li key={item.name ?? item.evaluator_id ?? index} className="min-w-0 border-b border-border pb-2 text-sm">
            <div className="flex items-start justify-between gap-2"><span>{item.label ?? humanize(item.name ?? item.evaluator ?? item.evaluator_id)}</span><strong className={item.status === "PASS" ? "text-forest" : item.status === "FAIL" ? "text-destructive" : "text-gold-dim"}>{item.status}</strong></div>
            {(item.details || item.message) && <p className="mt-1 text-xs text-muted-foreground">{item.details ?? item.message}</p>}
          </li>)}
        </ul> : <p className="mt-2 text-sm text-muted-foreground">No evaluator results were provided.</p>}
      </section>}
      {!!run.tasks.length && <section>
        <h2 className="gold-heading text-xl font-bold">Decision trace &amp; data sources</h2>
        <ul className="mt-3 space-y-2">{run.tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm">
          <ExecutorBadge executor={task.executor} /><span className="min-w-0 flex-1">{task.name}</span>
          <span className="text-xs text-muted-foreground">{humanize(task.status)}</span><span className="break-all font-mono text-[11px] text-muted-foreground">{task.data_source}</span>
        </li>)}</ul>
      </section>}
    </div>
  );
}