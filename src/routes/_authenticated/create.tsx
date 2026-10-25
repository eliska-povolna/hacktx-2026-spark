import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
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
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ApiRequestError,
  createRun,
  deleteAttachment,
  evaluateMobilityTrigger,
  getContextSources,
  getDemoCustomers,
  getRun,
  getSavedTeam,
  isMockMode,
  planTeam,
  saveTeam,
  uploadAttachment,
} from "@/api/client";
import { savedTeamsQueryOptions } from "@/api/saved-teams-query";
import type {
  AgentDefinition,
  Attachment,
  ContextSource,
  DemoCustomer,
  Run,
  TeamDefinition,
  WorkStyle,
} from "@/api/types";
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

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "BUDGET_LIMIT",
  "APPROVAL_REQUIRED",
  "NO_ACTION_NEEDED",
]);

const TERMINAL_MESSAGES: Record<string, string> = {
  FAILED: "The run failed before completing. Adjust the goal or team and run again.",
  BUDGET_LIMIT: "The run stopped when it reached its budget limit. Partial results are shown above.",
  APPROVAL_REQUIRED: "The run is paused — it needs your approval before it can continue.",
  NO_ACTION_NEEDED:
    "No mobility action is needed for this customer right now. Banking and recommendation steps were skipped.",
};

const WORK_STYLES: { value: WorkStyle; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "thorough", label: "Thorough" },
];

function QuestForgePage() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const copy = THEME_COPY[theme];
  // The theme's sample goal is only the INITIAL value — switching themes must
  // never overwrite the user's quest text, selected agents, or run state.
  const [quest, setQuest] = useState(() => THEME_COPY[readTheme()].sampleQuest);
  const [baseAgents, setAgents] = useState<AgentDefinition[]>([]);
  const agents = getAgentsForTheme(theme, baseAgents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const [plannedTeam, setPlannedTeam] = useState<TeamDefinition | null>(null);
  const { teamId } = Route.useSearch();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [customers, setCustomers] = useState<DemoCustomer[]>([]);
  const [customerError, setCustomerError] = useState(false);
  const [customerId, setCustomerId] = useState("customer-stable");
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  const [enabledSourceIds, setEnabledSourceIds] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<WorkStyle>("balanced");
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const loadedTeamIdRef = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const toyotaEnabled = enabledSourceIds.includes("toyota_customer");
  const nessieEnabled = enabledSourceIds.includes("nessie_banking");
  const isPortfolio = plannedTeam?.policy?.scope === "portfolio";
  const isSimplePlay = plannedTeam?.policy?.workflow_kind === "simple_play";

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
    if (!teamId) {
      if (loadedTeamIdRef.current) {
        loadedTeamIdRef.current = null;
        setPlannedTeam(null);
        setAgents([]);
        setSelectedId(null);
        setConfigureId(null);
        setRun(null);
        setQuest(THEME_COPY[readTheme()].sampleQuest);
      }
      return;
    }
    let active = true;
    setLoadingTeam(true);
    getSavedTeam(teamId).then((team) => {
      if (!active) return;
      loadedTeamIdRef.current = teamId;
      setPlanningError(null);
      setPlannedTeam(team); setAgents(team.agents); setQuest(team.goal);
      setSelectedId(team.agents[0]?.id ?? null);
      setRun(null);
      if (team.policy?.work_style) setWorkStyle(team.policy.work_style);
    }).catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not open the saved team."); })
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

  useEffect(() => {
    getContextSources()
      .then((sources) => {
        const builtins = sources.filter((source) => source.type === "builtin" || !source.id.startsWith("file:"));
        setContextSources(builtins);
        setEnabledSourceIds((current) => {
          if (current.length > 0) {
            return current.filter((id) => builtins.some((source) => source.id === id));
          }
          // Fantasy defaults to connector-free simple play — no Toyota/Nessie chips on.
          if (readTheme() === "fantasy") return [];
          return builtins.map((source) => source.id);
        });
      })
      .catch(() => {
        toast.error("Context sources are unavailable. Reload before running.");
      });
  }, []);

  // Theme switch resets demo connectors before paint so a quick chip click
  // cannot race the auto-enable and accidentally turn Toyota context back off.
  useLayoutEffect(() => {
    if (plannedTeam) return;
    setEnabledSourceIds((current) => {
      const builtinIds = contextSources
        .filter((source) => source.type === "builtin" || !source.id.startsWith("file:"))
        .map((source) => source.id);
      if (theme === "fantasy") {
        return current.filter((id) => !builtinIds.includes(id));
      }
      if (builtinIds.length === 0) return current;
      return Array.from(new Set([...current, ...builtinIds]));
    });
  }, [theme, contextSources, plannedTeam]);

  const stopPolling = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => stopPolling, []);

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        try {
          const attachment = await uploadAttachment(file);
          setAttachments((current) => [...current, attachment]);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not upload the file.");
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    setDeletingId(attachment.id);
    try {
      await deleteAttachment(attachment.id);
      setAttachments((current) => current.filter((file) => file.id !== attachment.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the file.");
    } finally {
      setDeletingId(null);
    }
  };

  const assembleParty = async () => {
    if (!quest.trim()) {
      toast.error(copy.toastNoGoal);
      return;
    }
    setPlanning(true);
    setPlanningError(null);
    setRun(null);
    try {
      const goal = quest;
      const planningTheme = theme;
      const sourceIds = [
        ...enabledSourceIds,
        ...attachments.map((file) => `file:${file.id}`),
      ];
      const res = await planTeam(goal, planningTheme, attachments.map((file) => file.id), {
        context_source_ids: sourceIds,
        work_style: workStyle,
      });
      setPlannedTeam({
        ...res.team,
        policy: {
          ...res.team.policy,
          max_llm_calls: res.team.policy?.max_llm_calls ?? 6,
          max_llm_cost_usd: res.team.policy?.max_llm_cost_usd ?? 0.2,
          work_style: workStyle,
          guardrails: res.team.policy?.guardrails ?? [],
        },
      });
      setAgents(res.team.agents);
      setSelectedId(res.team.agents[0]?.id ?? null);
      toast.success("Your team has assembled.");
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : copy.toastPlanError;
      setPlanningError(message);
      toast.error(message);
    } finally {
      setPlanning(false);
    }
  };

  const saveChanges = async () => {
    if (!plannedTeam || saving || planningError) return;
    setSaving(true);
    try {
      const saved = await saveTeam({
        goal: quest,
        team: {
          ...plannedTeam,
          agents: baseAgents,
          policy: {
            ...plannedTeam.policy,
            max_llm_calls: plannedTeam.policy?.max_llm_calls ?? 6,
            max_llm_cost_usd: plannedTeam.policy?.max_llm_cost_usd ?? 0.2,
            work_style: workStyle,
            guardrails: plannedTeam.policy?.guardrails ?? [],
          },
        },
      });
      setPlannedTeam((current) => current ? { ...current, id: saved.id } : current);
      await queryClient.invalidateQueries({ queryKey: savedTeamsQueryOptions.queryKey });
      toast.success(`${saved.name} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the team.");
    } finally {
      setSaving(false);
    }
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
          } else if (next.status === "NO_ACTION_NEEDED") {
            toast.info("No mobility action needed for this customer.");
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

  const runBlockReason = (): string | null => {
    if (running || planning || loadingTeam || uploading || deletingId !== null) {
      return "Wait for the current action to finish.";
    }
    if (planningError) return "Fix the planning error before running.";
    if (!toyotaEnabled && !isSimplePlay) {
      return "Turn on Toyota customer context (chip above), or assemble a simple-play team that needs no connectors.";
    }
    if (isPortfolio && !nessieEnabled) {
      return "Turn on Capital One Nessie banking — portfolio runs need live banking context.";
    }
    if (!isSimplePlay && !isPortfolio && (customerError || customers.length === 0)) {
      return "Customer data is unavailable. Reload before running.";
    }
    return null;
  };

  const startRun = async () => {
    const blocked = runBlockReason();
    if (blocked) {
      toast.error(blocked);
      return;
    }
    setRunning(true);
    setRun(null);
    try {
      const sourceIds = [
        ...enabledSourceIds,
        ...attachments.map((file) => `file:${file.id}`),
      ];
      const team: TeamDefinition = {
        id: plannedTeam?.id ?? "custom-team",
        team_name: plannedTeam?.team_name ?? "Custom Team",
        summary: plannedTeam?.summary ?? quest.slice(0, 120),
        agents: baseAgents.map((agent) => ({ ...agent, portrait: "" })),
        policy: {
          ...plannedTeam?.policy,
          max_llm_calls: plannedTeam?.policy?.max_llm_calls ?? 6,
          max_llm_cost_usd: plannedTeam?.policy?.max_llm_cost_usd ?? 0.2,
          work_style: workStyle,
          guardrails: plannedTeam?.policy?.guardrails ?? [],
        },
      };
      const { run_id } = await createRun({
        goal: quest,
        team,
        customerId: isPortfolio ? "" : customerId,
        attachment_ids: attachments.map((file) => file.id),
        context_source_ids: sourceIds,
        quality_mode: workStyle === "thorough" ? "strict" : "normal",
      });
      pollRun(run_id);
    } catch (error) {
      setRunning(false);
      toast.error(error instanceof ApiRequestError ? error.message : copy.toastRunError);
    }
  };

  const runMobilityTrigger = async () => {
    if (triggering || !toyotaEnabled) return;
    setTriggering(true);
    try {
      const result = await evaluateMobilityTrigger(customerId, false);
      if (result.relevant) {
        toast.success(`Mobility trigger relevant: ${result.reasons[0] ?? "action recommended"}`);
      } else {
        toast.info(result.reasons[0] ?? "No mobility action needed.");
      }
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not evaluate mobility trigger.");
    } finally {
      setTriggering(false);
    }
  };

  const toggleContextSource = (id: string) => {
    setEnabledSourceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
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
          {(contextSources.length > 0 ? contextSources : copy.contextChips.map((label, i) => ({
            id: `legacy-${i}`,
            label,
            dismissible: false,
            description: "",
            type: "legacy",
            status: "ready",
          }))).map((source, i) => {
            const ChipIcon = CHIP_ICONS[i % CHIP_ICONS.length] ?? FileText;
            const toggleable = "id" in source && !String(source.id).startsWith("legacy-")
              && ("dismissible" in source ? source.dismissible !== false : true);
            const enabled = toggleable
              ? enabledSourceIds.includes(source.id)
              : true;
            return (
              <button
                key={source.id}
                type="button"
                aria-pressed={enabled}
                title={
                  toggleable
                    ? `${enabled ? "On" : "Off"} — ${source.description || source.label}. Click to ${enabled ? "disable" : "enable"}.`
                    : source.description || source.label
                }
                disabled={!toggleable || planning || running}
                onClick={() => toggleable && toggleContextSource(source.id)}
                className={cn(
                  "chip-parchment",
                  toggleable && "cursor-pointer",
                  enabled ? "arcane-selected" : "opacity-45",
                )}
              >
                <ChipIcon className="h-3 w-3" /> {source.label}
                {toggleable && (
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {enabled ? "On" : "Off"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv,.json,.log,text/*"
          multiple
          className="hidden"
          aria-label="Add Files"
          onChange={uploadFiles}
          disabled={uploading || deletingId !== null || planning || running}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-parchment text-ink hover:bg-parchment-deep hover:text-ink border-gold-dim"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deletingId !== null || planning || running}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Plus />} {uploading ? "Uploading..." : "Add Files"}
          </Button>
          {attachments.map((file) => (
            <span key={file.id} className="chip-parchment max-w-full min-w-0">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="min-w-0 truncate" title={file.filename}>{file.filename}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                aria-label={`Remove ${file.filename}`}
                title={`Remove ${file.filename}`}
                onClick={() => removeAttachment(file)}
                disabled={uploading || deletingId !== null || planning || running}
              >
                {deletingId === file.id ? <Loader2 className="animate-spin" /> : <X />}
              </Button>
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">
          Files shape team planning (excerpts go to the planner). Runtime execution still uses enabled context sources — enable Toyota customer context to run the mobility demo.
        </p>
        {/* Controls: full-width rows on phones, inline group on larger screens */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <label className="flex w-full flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            Work style
            <select
              value={workStyle}
              onChange={(e) => {
                const next = e.target.value as WorkStyle;
                setWorkStyle(next);
                setPlannedTeam((current) =>
                  current
                    ? {
                        ...current,
                        policy: {
                          ...current.policy,
                          max_llm_calls: current.policy?.max_llm_calls ?? 6,
                          max_llm_cost_usd: current.policy?.max_llm_cost_usd ?? 0.2,
                          work_style: next,
                          guardrails: current.policy?.guardrails ?? [],
                        },
                      }
                    : current,
                );
              }}
              className="parchment-inset w-full max-w-full truncate px-2 py-2 text-xs text-ink outline-none focus:border-gold-dim sm:w-auto sm:py-1.5"
              disabled={planning || running}
            >
              {WORK_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </label>
          {agents.length > 0 && toyotaEnabled && !isPortfolio && customers.length > 0 && (
            <label className="flex w-full flex-col gap-1 text-xs font-semibold text-ink-soft sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              Customer
              <select
                value={customerId}
                disabled={running || planning}
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
          {agents.length > 0 && toyotaEnabled && !isPortfolio && (
            <button
              type="button"
              onClick={runMobilityTrigger}
              disabled={triggering || running || planning || customerError || customers.length === 0}
              className="btn-outline-gold w-full px-4 py-2.5 text-sm !text-ink sm:w-auto sm:py-2"
            >
              {triggering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking trigger...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" /> Check Trigger
                </>
              )}
            </button>
          )}
          {agents.length > 0 && (
            <button
              type="button"
              onClick={startRun}
              disabled={running || planning || loadingTeam || uploading || deletingId !== null}
              className="btn-outline-gold w-full px-4 py-2.5 text-sm !text-ink sm:w-auto sm:py-2"
              title={runBlockReason() ?? "Start the run with the enabled context sources"}
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
            disabled={planning || running || loadingTeam || uploading || deletingId !== null}
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
        {agents.length > 0 && !isSimplePlay && !toyotaEnabled && (
          <p className="mt-2 text-[11px] text-crimson">
            Turn on the Toyota customer context chip to run this mobility team. Nessie banking is {nessieEnabled ? "on" : "off"}.
          </p>
        )}
        {agents.length > 0 && isPortfolio && !nessieEnabled && (
          <p className="mt-2 text-[11px] text-crimson">
            Turn on Capital One Nessie banking — portfolio shortlists need banking context.
          </p>
        )}
      </section>

      {agents.length > 0 && toyotaEnabled && (
        <section className="parchment-panel p-4" aria-label="Execution preview">
          <h2 className="gold-heading text-lg font-bold">Before you run</h2>
          {isPortfolio ? (
            <>
              <p className="mt-2 text-sm text-ink">This run evaluates the full synthetic Toyota demo portfolio. No offers, applications or transactions are submitted.</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink">
                <li>CODE · Load the installed Toyota portfolio.</li>
                {plannedTeam?.policy?.workflow_kind === "mobility_decision" && <li>CODE · Skip customers without a relevant mobility decision before any banking or LLM work.</li>}
                <li>TOOL · Read Nessie for the remaining customers; CODE · derive financial summaries.</li>
                <li>CODE · {plannedTeam?.policy?.workflow_kind === "loan_opportunity" ? "Rank financial fit for vehicle-loan outreach." : "Score mobility options and rank decision urgency."}</li>
                <li>AGENT / LLM · Explain the deterministic shortlist using derived summaries only.</li>
              </ol>
              {!nessieEnabled && <p role="alert" className="mt-2 text-sm text-destructive">Enable Nessie banking to run this financial portfolio workflow.</p>}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink">This run evaluates one selected Toyota customer. It does not scan the portfolio or send offers.</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink">
                <li>TOOL · Load synthetic Toyota profile, vehicle, lease and usage context.</li>
                <li>CODE · Check relevance. If no decision is due, stop with NO_ACTION_NEEDED, without Nessie or an LLM.</li>
                {nessieEnabled ? <>
                  <li>TOOL · Read Nessie banking data; CODE · derive financial summaries and score mobility options.</li>
                  <li>AGENT / LLM · Explain scored options using derived summaries; CODE · validate the result. Policy may require a reviewer.</li>
                </> : <li>Nessie is off: context and relevance checks only. No financial recommendation will be generated.</li>}
              </ol>
            </>
          )}
          <p className="mt-3 text-xs text-ink-soft">Run enforces the submitted tools, permissions and budgets. Missing access fails; it is never added automatically.</p>
        </section>
      )}

      {planningError && (
        <div role="alert" className="parchment-panel space-y-1 p-4 text-sm text-destructive">
          <p>{planningError}</p>
          <p className="text-ink-soft">
            Assemble successfully or reload a saved team before running or saving. Any team still displayed is from the previous plan.
          </p>
        </div>
      )}

      {/* SECTION 2 — Team */}
      {agents.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="gold-heading text-xl font-bold">{copy.teamTitle}</h2>
            <span className="text-xs text-muted-foreground">
              {agents.length} {copy.readySuffix}
            </span>
            <Button variant="outline" onClick={saveChanges} disabled={Boolean(planningError) || saving || planning || running || loadingTeam || !plannedTeam}>
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
                {isMockMode() ? copy.outputsBadge : (run?.tasks.some((task) => task.data_source === "NESSIE_FALLBACK" || task.data_source === "NESSIE_MIXED") || run?.portfolio_result?.candidates.some((candidate) => candidate.financial_summary.nessie_provenance === "NESSIE_FALLBACK")) ? "Fixture banking data" : copy.outputsBadgeLive}
              </span>
            </div>
            {run.portfolio_result ? (
              <div>
                <h4 className="font-display text-base font-bold text-ink">{run.portfolio_result.purpose === "loan" ? "Vehicle-loan opportunity shortlist" : "Mobility decision priorities"}</h4>
                <p className="mt-2 text-sm text-ink-soft">{run.portfolio_result.narrative || "No relevant customers need action."}</p>
              </div>
            ) : displayReward ? (
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
            ) : run.outputs && run.outputs.length > 0 ? (
              <div className="space-y-3">
                {run.outputs.map((output) => (
                  <div key={output.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Trophy className="h-4 w-4 text-gold-dim" />
                      <h4 className="font-display text-base font-bold text-ink">{output.title}</h4>
                    </div>
                    {output.summary && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{output.summary}</p>
                    )}
                    {output.content && output.content !== output.summary && (
                      <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm text-ink">
                        {output.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm italic text-ink-soft">
                {!TERMINAL_STATUSES.has(run.status) && <Loader2 className="h-4 w-4 animate-spin" />}
                {TERMINAL_STATUSES.has(run.status)
                  ? "This run finished without output text. Try running the team again."
                  : `The team is still working... (${run.status.toLowerCase().replaceAll("_", " ")})`}
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

          {/* Log — capped height so long traces don't stretch the page */}
          <section className="parchment-panel flex max-h-[min(22rem,50vh)] flex-col p-5">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">{copy.log}</h3>
              <span className="text-[11px] font-semibold text-ink-soft">
                {run.log.length} steps
              </span>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {run.log.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink-soft">
                    {entry.timestamp}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-ink">{entry.message}</span>
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

      {run && (
        <RunDetails
          run={run}
          toyota={theme === "toyota" || toyotaEnabled || Boolean(run.recommendation || run.financial_context)}
          showNessie={nessieEnabled || Boolean(run.financial_context)}
        />
      )}

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
