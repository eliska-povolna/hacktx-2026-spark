import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { createRun, getRun, planTeam } from "@/api/client";
import type { AgentDefinition, Run } from "@/api/types";
import { AdventurerCard } from "@/components/AdventurerCard";
import { CharacterSheet } from "@/components/CharacterSheet";
import { ConfigureAdventurerDialog } from "@/components/ConfigureAdventurerDialog";
import { ExecutorBadge } from "@/components/ExecutorBadge";
import { PORTRAITS } from "@/api/mockData";
import {
  getAgentsForTheme,
  THEME_COPY,
  TOYOTA_METRICS,
  TOYOTA_REWARD,
  useTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Quest Forge — QuestMaster" },
      {
        name: "description",
        content:
          "Describe your quest and assemble a party of AI adventurers with skills, tools, guardrails, and budgets.",
      },
      { property: "og:title", content: "Quest Forge — QuestMaster" },
      {
        property: "og:description",
        content: "Describe your quest and assemble a party of AI adventurers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuestForgePage,
});

const CHIP_ICONS = [FileText, BarChart3, Trophy, Shield, Link2];

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "BUDGET_LIMIT", "APPROVAL_REQUIRED"]);

function QuestForgePage() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [quest, setQuest] = useState(copy.sampleQuest);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [running, setRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = agents.find((a) => a.id === selectedId) ?? null;
  const configureAgent = agents.find((a) => a.id === configureId) ?? null;

  // Switching themes is presentation-only, but the demo sample content follows
  // the theme (Toyota shows its mobility decision sample).
  useEffect(() => {
    setQuest(THEME_COPY[theme].sampleQuest);
    setAgents((prev) => getAgentsForTheme(theme, prev));
  }, [theme]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const assembleParty = async () => {
    if (!quest.trim()) {
      toast.error("Describe your quest first.");
      return;
    }
    setPlanning(true);
    setRun(null);
    try {
      const res = await planTeam(quest);
      const themedAgents = getAgentsForTheme(theme, res.team.agents);
      setAgents(themedAgents);
      setSelectedId(themedAgents[0]?.id ?? null);
      toast.success("Your team has assembled.");
    } catch {
      toast.error("The guild archives could not be reached.");
    } finally {
      setPlanning(false);
    }
  };

  const startRun = async () => {
    if (running) return;
    setRunning(true);
    setRun(null);
    try {
      const { run_id } = await createRun(quest);
      pollRef.current = setInterval(async () => {
        try {
          const next = await getRun(run_id);
          // Toyota demo overlay: presentation-only mock result for this theme.
          if (theme === "toyota" && next.status === "COMPLETED") {
            next.reward = TOYOTA_REWARD;
            next.metrics = TOYOTA_METRICS;
          }
          setRun(next);
          if (TERMINAL_STATUSES.has(next.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setRunning(false);
            if (next.status === "COMPLETED") {
              toast.success("Run completed — results revealed.");
            }
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setRunning(false);
        }
      }, 1000);
    } catch {
      setRunning(false);
      toast.error("The quest could not be started.");
    }
  };

  const saveAgent = (updated: AgentDefinition) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    toast.success(`${updated.name} has been reconfigured.`);
  };

  const removeAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success("Adventurer dismissed from the party.");
  };

  const addCustomAgent = () => {
    const n = agents.length + 1;
    const custom: AgentDefinition = {
      id: `custom-${Date.now()}`,
      name: `Agent ${n}`,
      role: "Custom Specialist",
      purpose: "A custom agent shaped by your goal.",
      description: "A custom agent. Configure their role, skills, and guardrails.",
      skills: ["Custom"],
      instructions: "",
      allowed_tools: ["Scroll Archive"],
      permissions: { data_scopes: ["guest_feedback"], actions: ["read"] },
      guardrails: ["Stay within budget limits"],
      model_policy: "Use LLM for reasoning. Prefer tools and code first.",
      budget: { max_llm_cost_usd: 0.5, max_llm_calls: 2 },
      estimated_cost_usd: 0.05,
      portrait: PORTRAITS[Object.keys(PORTRAITS)[n % 5] ?? "maya"]!,
    };
    setAgents((prev) => [...prev, custom]);
    setSelectedId(custom.id);
    setConfigureId(custom.id);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            const ChipIcon = CHIP_ICONS[i % CHIP_ICONS.length]!;
            return (
              <span key={label} className="chip-parchment">
                <ChipIcon className="h-3 w-3" /> {label}
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => toast.info("File attachments arrive with the real backend.")}
            className="chip-parchment border-dashed hover:border-gold-dim"
          >
            <Plus className="h-3 w-3" /> Add Files
          </button>
          <div className="ms-auto flex gap-2">
            {agents.length > 0 && (
              <button
                onClick={startRun}
                disabled={running}
                className="btn-outline-gold px-4 py-2 text-sm !text-ink"
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
            <button onClick={assembleParty} disabled={planning} className="btn-crimson px-5 py-2 text-sm">
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
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
        <CharacterSheet agent={selected} onConfigure={() => setConfigureId(selected.id)} />
      )}

      {/* SECTIONS 4–6 — Rewards / Mana & Cost / Quest Log */}
      {run && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Quest Rewards */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">Quest Rewards</h3>
              <span className="chip-parchment !text-[10px] uppercase tracking-wider">Mock Output</span>
            </div>
            {run.reward ? (
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold-dim" />
                  <h4 className="font-display text-base font-bold text-ink">{run.reward.title}</h4>
                  <span className="rounded-full bg-forest/15 px-2 py-0.5 text-[11px] font-bold text-forest">
                    {Math.round(run.reward.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{run.reward.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {run.reward.reasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-ink">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm italic text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" />
                The party is still on its quest... ({run.status.toLowerCase().replace("_", " ")})
              </p>
            )}
          </section>

          {/* Mana & Cost */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">Mana & Cost</h3>
              <span className="text-[11px] font-semibold text-ink-soft">View Details →</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="parchment-inset p-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Total Cost</div>
                <div className="font-display text-xl font-bold text-ink">
                  ${run.metrics.estimated_ai_cost_usd.toFixed(2)}
                </div>
              </div>
              <div className="parchment-inset p-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">vs. Full LLM</div>
                <div className="font-display text-xl font-bold text-ink">
                  ${run.metrics.estimated_baseline_cost_usd.toFixed(2)}
                </div>
              </div>
              <div className="parchment-inset p-2 !bg-forest/15">
                <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">AI Calls Avoided</div>
                <div className="font-display text-xl font-bold text-forest">87%</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Token & Tool Usage
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-gold-dim/50">
                <div className="bg-[oklch(0.55_0.18_300)]" style={{ width: "38%" }} />
                <div className="bg-[oklch(0.55_0.12_210)]" style={{ width: "45%" }} />
                <div className="bg-[oklch(0.5_0.14_150)]" style={{ width: "17%" }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.55_0.18_300)]" /> LLM — 38% (4.2K)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.55_0.12_210)]" /> Tool Calls — 45% (5.1K)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.5_0.14_150)]" /> Code — 17% (1.9K)
                </span>
              </div>
              <p className="mt-3 text-[11px] italic leading-snug text-ink-soft">
                Adventurers define responsibility — the platform chooses code or tools instead of AI
                whenever they suffice.
              </p>
            </div>
          </section>

          {/* Quest Log */}
          <section className="parchment-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink">Quest Log</h3>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> The quest is being planned...
                </li>
              )}
            </ul>
          </section>
        </div>
      )}

      {/* Run status banner */}
      {run && !TERMINAL_STATUSES.has(run.status) && (
        <div className="flex items-center gap-3 rounded-lg border border-arcane/60 bg-arcane/20 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-arcane-bright" />
          <span className="text-sm font-semibold text-foreground">
            Quest {run.run_id} — {run.status.toLowerCase().replace("_", " ")}...
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
