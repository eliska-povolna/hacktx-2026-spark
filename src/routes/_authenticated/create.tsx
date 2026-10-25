import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Plus,
  Save,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { ApiRequestError, createRun, getDemoCustomers, getRun, getSavedTeam, isMockMode, planTeam, saveTeam } from "@/api/client";
import type { AgentDefinition, DemoCustomer, Run, TeamDefinition } from "@/api/types";
import { AdventurerCard } from "@/components/AdventurerCard";
import { CharacterSheet } from "@/components/CharacterSheet";
import { ConfigureAdventurerDialog } from "@/components/ConfigureAdventurerDialog";
import { ExecutorBadge } from "@/components/ExecutorBadge";
import { RunDetails } from "@/components/RunDetails";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { computeAvoidedPct, computeTaskSplit } from "@/lib/metrics";
import { formatMoney } from "@/lib/result-format";
import {
  createCustomAgent,
  getAgentsForTheme,
  readTheme,
  THEME_COPY,
  useTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/create")({
  validateSearch: (search: Record<string, unknown>): { teamId?: string } => ({
    ...(typeof search["teamId"] === "string" ? { teamId: search["teamId"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Create — QuestMaster" },
      {
        name: "description",
        content:
          "Describe your goal and assemble a team of AI agents with skills, tools, guardrails, and budgets.",
      },
      { property: "og:title", content: "Create — QuestMaster" },
      {
        property: "og:description",
        content: "Describe your goal and assemble a team of AI agents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuestForgePage,
});

const CHIP_ICONS = [FileText, BarChart3, Trophy, Shield, Link2];

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "BUDGET_LIMIT", "APPROVAL_REQUIRED"]);

const TERMINAL_MESSAGES: Record<string, string> = {
  FAILED: "The run failed before completing. Adjust the goal or team and run again.",
  BUDGET_LIMIT: "The run stopped when it reached its budget limit. Partial results are shown above.",
  APPROVAL_REQUIRED: "The run is paused — it needs your approval before it can continue.",
};

function QuestForgePage() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  // The theme's sample goal is only the INITIAL value — switching themes must
  // never overwrite the user's quest text, selected agents, or run state.
  const [quest, setQuest] = useState(() => THEME_COPY[readTheme()].sampleQuest);
  const [baseAgents, setAgents] = useState<AgentDefinition[]>([]);
  const agents = getAgentsForTheme(theme, baseAgents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [plannedTeam, setPlannedTeam] = useState<TeamDefinition | null>(null);
  const { teamId } = Route.useSearch();
  const [savedId, setSavedId] = useState<string | undefined>();
  const [sourceTheme, setSourceTheme] = useState(theme);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [customers, setCustomers] = useState<DemoCustomer[]>([]);
  const [customerError, setCustomerError] = useState(false);
  const [customerId, setCustomerId] = useState("customer-stable");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();

  // Sample-goal switching: when the theme changes, replace the quest text
  // ONLY if it is still the previous theme's untouched sample (or empty).
  // Anything the user typed or edited is preserved exactly.
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    const prev = prevThemeRef.current;
    prevThemeRef.current = theme;
    if (prev === theme || plannedTeam) return;
    setQuest((q) =>
      q.trim() === "" || q === THEME_COPY[prev].sampleQuest ? THEME_COPY[theme].sampleQuest : q,
    );
  }, [theme, plannedTeam]);

  useEffect(() => {
    if (!teamId) return;
    let active = true;
    setLoadingTeam(true);
    getSavedTeam(teamId).then((team) => {
      if (!active) return;
      setPlannedTeam(team); setAgents(team.agents); setQuest(team.goal);
      setSavedId(team.id); setSourceTheme(team.interface_theme); setSelectedId(team.agents[0]?.id ?? null);
      setRun(null); setSaveError(false);
    }).catch(() => { if (active) toast.error("Could not open the saved team."); })
      .finally(() => { if (active) setLoadingTeam(false); });
    return () => { active = false; };
  }, [teamId]);

  // On mobile the character sheet sits below the card grid — scroll to it
  // when an agent is selected so the tap feels like it opens the profile.
  useEffect(() => {
    if (!isMobile || !selectedId) return;
    sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId, isMobile]);

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const configureAgent = agents.find((a) => a.id === configureId) ?? null;

  // Demo customers for the run context (API_SPEC §8).
  useEffect(() => {
    getDemoCustomers()
      .then((list) => {
        setCustomers(list);
        if (list.length > 0 && !list.some((c) => c.id === customerId)) {
          setCustomerId(list[0]?.id ?? "customer-stable");
        }
      })
      .catch(() => {
        setCustomerError(true);
        toast.error("Customer data is unavailable. Please reload before running the team.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => stopPolling, []);

  const assembleParty = async () => {
    if (!quest.trim()) {
      toast.error(copy.toastNoGoal);
      return;
    }
    setPlanning(true);
    setRun(null);
    try {
      const goal = quest;
      const planningTheme = theme;
      const res = await planTeam(goal, planningTheme);
      setPlannedTeam(res.team);
      setAgents(res.team.agents);
      setSelectedId(res.team.agents[0]?.id ?? null);
      setSourceTheme(planningTheme); setSavedId(undefined); setSaveError(false);
      try {
        const saved = res.saved_team ?? await saveTeam({ team: res.team, goal, interface_theme: planningTheme });
        setSavedId(saved.id); setPlannedTeam(saved);
      } catch {
        setSaveError(true);
        toast.warning("Team created, but not saved. The team storage service is unavailable.");
      }
      toast.success("Your team has assembled.");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.displayMessage ?? copy.toastPlanError : copy.toastPlanError);
    } finally {
      setPlanning(false);
    }
  };

  const saveChanges = async () => {
    if (!plannedTeam || saving) return;
    setSaving(true);
    try {
      const saved = await saveTeam({ team: { ...plannedTeam, agents: baseAgents }, goal: quest, interface_theme: sourceTheme }, savedId);
      setSavedId(saved.id); setPlannedTeam(saved); setSaveError(false);
      toast.success(isMockMode() ? "Team saved for this demo session." : "Team saved.");
    } catch { setSaveError(true); toast.error("Could not save the team. Your changes remain open here."); }
    finally { setSaving(false); }
  };

  // Chained-timeout polling: the next poll is scheduled only after the
  // previous one finishes, so requests can never overlap.
  const pollRun = (runId: string) => {
    const tick = async () => {
      try {
        const next = await getRun(runId);
        setRun(next);
        if (TERMINAL_STATUSES.has(next.status)) {
          pollRef.current = null;
          setRunning(false);
          if (next.status === "COMPLETED") {
            toast.success("Run completed — results revealed.");
          } else if (next.status === "FAILED") {
            toast.error("The run failed. Adjust the goal or team and try again.");
          } else if (next.status === "BUDGET_LIMIT") {
            toast.warning("The run stopped at its budget limit.");
          } else if (next.status === "APPROVAL_REQUIRED") {
            toast.info("The run is waiting for your approval.");
          }
          return;
        }
      } catch {
        pollRef.current = null;
        setRunning(false);
        toast.error("Lost contact with the run. You can run the team again.");
        return;
      }
      pollRef.current = setTimeout(tick, 1000);
    };
    pollRef.current = setTimeout(tick, 1000);
  };

  const startRun = async () => {
    if (running) return;
    setRunning(true);
    setRun(null);
    try {
      // API_SPEC §9: send the full payload — goal, the whole team (including
      // any edits/removals/custom agents), and the selected demo customer.
      // Send the canonical generated configuration in every interface.
      const team: TeamDefinition = {
        id: plannedTeam?.id ?? "custom-team",
        team_name: plannedTeam?.team_name ?? "Custom Team",
        summary: plannedTeam?.summary ?? quest.slice(0, 120),
        agents: baseAgents.map((agent) => ({ ...agent, portrait: "" })),
      };
      const { run_id } = await createRun({ goal: quest, team, customerId });
      pollRun(run_id);
    } catch {
      setRunning(false);
      toast.error(copy.toastRunError);
    }
  };

  const saveAgent = (updated: AgentDefinition) => {
    setAgents((prev) => prev.map((a) => a.id !== updated.id ? a : {
      ...updated,
      portrait: a.portrait,
      customized: true,
    }));
    toast.success(`${updated.name} has been reconfigured.`);
  };

  const removeAgent = (id: string) => {
    const removed = agents.find((a) => a.id === id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success(copy.toastAgentRemoved(removed?.name ?? "Agent"));
  };

  const addCustomAgent = () => {
    const custom = createCustomAgent(baseAgents);
    setAgents((prev) => [...prev, custom]);
    setSelectedId(custom.id);
    setConfigureId(custom.id);
  };

  // Run results stay authoritative across interface switches as well.
  const displayReward = run?.reward ?? null;
  const displayMetrics = run?.metrics ?? null;
  const avoidedPct = displayMetrics ? computeAvoidedPct(displayMetrics) : 0;
  const split = displayMetrics ? computeTaskSplit(displayMetrics) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {loadingTeam && <p role="status" className="text-muted-foreground">Loading saved team...</p>}
      {saveError && <p role="alert" className="text-destructive">This team is not saved. Your current changes are only available on this page.</p>}
      {customerError && <p role="alert" className="text-destructive">Customer data is unavailable. Reload the page to try again.</p>}
      {/* SECTION 1 — Goal input */}
      <section className="parchment-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="toyota-road font-display text-2xl font-bold text-ink sm:text-3xl">
            {copy.goalTitle}
          </h1>
          <span className="chip-parchment !text-[10px] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Sample Goal
          </span>
        </div>
        <textarea
          value={quest}
          onChange={(e) => setQuest(e.target.value)}
          rows={3}
          className="parchment-inset mt-4 w-full px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-gold-dim"
          placeholder={copy.sampleQuest}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {copy.contextChips.map((label, i) => {
            const ChipIcon = CHIP_ICONS[i % CHIP_ICONS.length] ?? FileText;
            return (
              <span key={label} className="chip-parchment">
                <ChipIcon className="h-3 w-3" /> {label}
              </span>
            );
          })}
        </div>
        {/* Controls: full-width rows on phones, inline group on larger screens */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {agents.length > 0 && customers.length > 0 && (
            <label className="flex w-full flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              Customer
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="parchment-inset w-full max-w-full truncate px-2 py-2 text-xs text-ink outline-none focus:border-gold-dim sm:w-auto sm:py-1.5"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.scenario_label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {agents.length > 0 && (
            <button
              onClick={startRun}
              disabled={running || planning || loadingTeam || customerError || customers.length === 0}
              className="btn-outline-gold w-full px-4 py-2.5 text-sm !text-ink sm:w-auto sm:py-2"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Run in progress...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" /> Run Team
                </>
              )}
            </button>
          )}
          <button
            onClick={assembleParty}
            disabled={planning || running || loadingTeam}
            className="btn-crimson w-full px-5 py-2.5 text-sm sm:w-auto sm:py-2"
          >
            {planning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Assembling your team...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {copy.buildButton}
              </>
            )}
          </button>
        </div>
      </section>

      {/* SECTION 2 — Team */}
      {agents.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="gold-heading text-xl font-bold">{copy.teamTitle}</h2>
            <span className="text-xs text-muted-foreground">
              {agents.length} {copy.readySuffix}
            </span>
            <Button variant="outline" onClick={saveChanges} disabled={saving || planning || loadingTeam}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Save Team
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {agents.map((agent) => (
              <AdventurerCard
                key={agent.id}
                agent={agent}
                selected={selectedId === agent.id}
                onSelect={() => setSelectedId(agent.id)}
              />
            ))}
            <button
              onClick={addCustomAgent}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold-dim/60 text-gold-dim transition-colors hover:border-gold hover:text-gold"
            >
              <Plus className="h-6 w-6" />
              <span className="font-display text-xs font-semibold">{copy.addCustom}</span>
            </button>
          </div>
        </section>
      )}

      {/* SECTION 3 — Character sheet */}
      {selected && (
        <section ref={sheetRef} className="scroll-mt-4">
          <CharacterSheet agent={selected} onConfigure={() => setConfigureId(selected.id)} />
        </section>
      )}

      {/* SECTIONS 4–6 — Outputs / Cost / Log */}
      {run && displayMetrics && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Outputs */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{copy.outputs}</h3>
              <span className="chip-parchment !text-[10px] uppercase tracking-wider">
                {isMockMode() ? copy.outputsBadge : copy.outputsBadgeLive}
              </span>
            </div>
            {displayReward ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold-dim" />
                  <h4 className="font-display text-base font-bold text-ink">{displayReward.title}</h4>
                  <span className="rounded-full bg-forest/15 px-2 py-0.5 text-[11px] font-bold text-forest">
                    {Math.round(displayReward.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{displayReward.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {displayReward.reasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-ink">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm italic text-ink-soft">
                {!TERMINAL_STATUSES.has(run.status) && <Loader2 className="h-4 w-4 animate-spin" />}
                {TERMINAL_STATUSES.has(run.status) ? "No recommendation is available for this run." : `The team is still working... (${run.status.toLowerCase().replaceAll("_", " ")})`}
              </p>
            )}
          </section>

          {/* Cost & Efficiency — all values derived from run.metrics */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{copy.cost}</h3>
              <span className="text-[11px] font-semibold text-ink-soft">
                {isMockMode() ? "Demo metrics" : "Live metrics"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
              <div className="parchment-inset p-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">AI Cost</div>
                <div className="font-display text-xl font-bold text-ink">
                  {formatMoney(displayMetrics.estimated_ai_cost_usd)}
                </div>
              </div>
              <div className="parchment-inset p-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Full-LLM Baseline</div>
                <div className="font-display text-xl font-bold text-ink">
                  ${displayMetrics.estimated_baseline_cost_usd.toFixed(2)}
                </div>
              </div>
              <div className="parchment-inset col-span-2 p-2 !bg-forest/15 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">AI Calls Avoided</div>
                <div className="font-display text-xl font-bold text-forest">{avoidedPct}%</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Task Execution Mix
              </div>
              {split && split.total > 0 ? (
                <>
                  <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-gold-dim/50">
                    <div className="bg-[oklch(0.55_0.18_300)]" style={{ width: `${split.llm}%` }} />
                    <div className="bg-[oklch(0.55_0.12_210)]" style={{ width: `${split.tool}%` }} />
                    <div className="bg-[oklch(0.5_0.14_150)]" style={{ width: `${split.code}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.55_0.18_300)]" /> LLM — {split.llm}% ({displayMetrics.llm_tasks})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.55_0.12_210)]" /> Tool Calls — {split.tool}% ({displayMetrics.tool_tasks})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.5_0.14_150)]" /> Code — {split.code}% ({displayMetrics.code_tasks})
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] italic text-ink-soft">No tasks recorded yet.</p>
              )}
              <p className="mt-3 text-[11px] italic leading-snug text-ink-soft">
                Agents define responsibility — the platform chooses code or tools instead of AI
                whenever they suffice.
              </p>
            </div>
          </section>

          {/* Log */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{copy.log}</h3>
              <span className="text-[11px] font-semibold text-ink-soft">
                {run.log.length} steps
              </span>
            </div>
            <ul className="space-y-2">
              {run.log.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-forest" />
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink-soft">
                    {entry.timestamp}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink">{entry.message}</span>
                  <ExecutorBadge executor={entry.executor} />
                </li>
              ))}
              {run.log.length === 0 && (
                <li className="flex items-center gap-2 text-sm italic text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin" /> The run is being planned...
                </li>
              )}
            </ul>
          </section>
        </div>
      )}

      {run && <RunDetails run={run} toyota={theme === "toyota"} />}

      {/* Run status banner — in progress */}
      {run && !TERMINAL_STATUSES.has(run.status) && (
        <div className="flex items-center gap-3 rounded-lg border border-arcane/60 bg-arcane/20 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-arcane-bright" />
          <span className="text-sm font-semibold text-foreground">
            Run {run.run_id} — {run.status.toLowerCase().replace("_", " ")}...
          </span>
          <span className="ms-auto flex gap-1.5">
            {run.tasks.map((t) => (
              <span
                key={t.id}
                title={`${t.name}: ${t.status}`}
                className={cn(
                  "h-2 w-2 rounded-full",
                  t.status === "COMPLETED"
                    ? "bg-forest"
                    : t.status === "RUNNING"
                      ? "animate-pulse bg-arcane-bright"
                      : "bg-muted-foreground/40",
                )}
              />
            ))}
          </span>
        </div>
      )}

      {/* Terminal banner — failed / budget / approval states explained */}
      {run && run.status !== "COMPLETED" && TERMINAL_MESSAGES[run.status] && (
        <div className="flex items-center gap-3 rounded-lg border border-crimson/60 bg-crimson/10 px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-crimson" />
          <span className="text-sm font-semibold text-foreground">
            {TERMINAL_MESSAGES[run.status]}
          </span>
        </div>
      )}

      {configureAgent && (
        <ConfigureAdventurerDialog
          agent={configureAgent}
          onClose={() => setConfigureId(null)}
          onSave={saveAgent}
          onRemove={removeAgent}
        />
      )}
    </div>
  );
}
