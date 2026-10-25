// Centralized QuestMaster API service layer.
// Components must call ONLY these functions — never fetch() directly.
//
// Live mode is the default (the tracked .env was removed — see .env.example).
// To use built-in demo data instead, create a local .env with:
//   VITE_USE_MOCK_API=true
//   VITE_API_BASE_URL=https://questmaster.tech/api
//
// The real backend contract lives in docs/QuestMaster_API_SPEC.md.
// Backend runs return `recommendation` + `audit_events`; normalizeRun()
// maps them onto the frontend Run shape (reward + log), so POST /api/runs
// returning only { run_id, status: "PLANNING" } is fine — the result
// arrives via polling GET /api/runs/{run_id}.

import {
  MOCK_AGENTS,
  MOCK_CUSTOMERS,
  MOCK_INTEGRATIONS,
  MOCK_LOG,
  MOCK_LOG_EVENTS,
  MOCK_METRICS,
  MOCK_PARTIES,
  MOCK_REWARD,
  MOCK_REWARD_STRESSED,
  MOCK_RUN_HISTORY,
  MOCK_RUN_TASKS,
} from "./mockData";
import type {
  AgentDefinition,
  AuditEvent,
  BackendRun,
  CreateRunInput,
  DemoCustomer,
  DemoSession,
  Integration,
  LogEvent,
  PlanTeamResponse,
  QuestLogEntry,
  QuestReward,
  Run,
  RunMetrics,
  RunStatus,
  RunSummary,
  RunTask,
  SavedParty,
  TaskStatus,
} from "./types";
import type { PlanningInterface, SavedTeam, SaveTeamInput } from "./types";
import { getPortrait, getSampleAgentsForTheme } from "@/lib/theme";

const USE_MOCK = (import.meta.env["VITE_USE_MOCK_API"] ?? "false") === "true";
const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "https://questmaster.tech/api";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockDelay() {
  return delay(300 + Math.random() * 600);
}

export class ApiRequestError extends Error {
  constructor(message: string, readonly displayMessage?: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const error = body && typeof body === "object" && "error" in body ? body.error : null;
    const message = error && typeof error === "object" && "message" in error
      && typeof error.message === "string" && error.message.trim() ? error.message : undefined;
    throw new ApiRequestError(message ?? `API request failed: ${res.status} ${path}`, message);
  }
  return res.status === 204 ? undefined as T : (await res.json()) as T;
}

export function isMockMode(): boolean {
  return USE_MOCK;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// The backend does not implement /demo-session — the hackathon session is
// client-side only (API_SPEC §5 allows this).
export async function createDemoSession(): Promise<DemoSession> {
  await mockDelay();
  return {
    user: {
      id: "demo-user",
      name: "Avery",
      organization: "QuestMaster Guild",
      role: "Quest Master",
    },
    workspace_id: "questmaster-demo",
  };
}

// The backend never sends portraits or descriptions (API_SPEC §3.3):
// fill the portrait from the local PORTRAITS set (matched by agent name or
// id) and fall back to `purpose` for the description.
export function normalizeAgents(agents: Partial<AgentDefinition>[]): AgentDefinition[] {
  return agents.map((agent, i) => {
    const name = agent.name ?? `Agent ${i + 1}`;
    const purpose = agent.purpose ?? "";
    return {
      id: agent.id ?? `agent-${i + 1}`,
      name,
      role: agent.role ?? "Specialist",
      purpose,
      description: agent.description || purpose,
      skills: agent.skills ?? [],
      instructions: agent.instructions ?? "",
      allowed_tools: agent.allowed_tools ?? [],
      permissions: agent.permissions ?? { data_scopes: [], actions: [] },
      guardrails: agent.guardrails ?? [],
      model_policy: agent.model_policy ?? "auto",
      budget: agent.budget ?? { max_llm_cost_usd: 0.05, max_llm_calls: 2 },
      estimated_cost_usd: agent.estimated_cost_usd ?? 0,
      portrait: agent.portrait || getPortrait("fantasy", agent.id ?? `agent-${i + 1}`, name),
    };
  });
}

function formatLogTimestamp(raw: string): string {
  return raw.includes("T") ? raw.slice(11, 19) : raw;
}

// Map a raw backend run (API_SPEC §10) onto the frontend Run shape.
export function normalizeRun(raw: BackendRun): Run {
  const tasks: RunTask[] = (raw.tasks ?? []).map((task, i) => ({
    id: task.id ?? `task-${i + 1}`,
    name: task.name ?? `Task ${i + 1}`,
    assigned_agent_id: task.assigned_agent_id ?? "",
    executor: task.executor ?? "TOOL",
    action: task.action ?? "",
    depends_on: task.depends_on ?? [],
    risk_level: task.risk_level ?? "medium",
    status: task.status ?? "WAITING",
    activity_summary: task.activity_summary ?? "",
    tool: task.tool ?? null,
    duration_ms: task.duration_ms ?? null,
    cost_usd: task.cost_usd ?? 0,
    data_source: task.data_source ?? "UNKNOWN",
  }));

  const metrics: RunMetrics = {
    llm_calls: 0,
    llm_calls_avoided: 0,
    input_tokens: 0,
    output_tokens: 0,
    estimated_ai_cost_usd: 0,
    estimated_baseline_cost_usd: 0,
    estimated_cost_saved_usd: 0,
    code_tasks: 0,
    tool_tasks: 0,
    llm_tasks: 0,
    ...raw.metrics,
  };

  const recommendation = raw.recommendation;
  const reward: QuestReward | null = recommendation
    ? {
        id: `rec-${raw.run_id}`,
        title: recommendation.headline,
        confidence: recommendation.confidence,
        summary: recommendation.summary,
        reasons: recommendation.reasons ?? [],
      }
    : null;

  const log: QuestLogEntry[] = (raw.audit_events ?? []).map((event) => ({
    id: event.id,
    timestamp: formatLogTimestamp(event.timestamp),
    message: event.message,
    executor: event.executor_type ?? "TOOL",
  }));

  return {
    run_id: raw.run_id,
    status: raw.status,
    goal: raw.goal,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    tasks,
    metrics,
    reward,
    log,
    recommendation: recommendation ?? null,
    financial_context: raw.financial_context ?? recommendation?.financial_context ?? null,
    evaluators: raw.evaluators ?? recommendation?.evaluators ?? [],
  };
}

export async function planTeam(goal: string, interfaceTheme: PlanningInterface = "fantasy"): Promise<PlanTeamResponse> {
  if (USE_MOCK) {
    await mockDelay();
    return {
      team: {
        id: crypto.randomUUID(),
        team_name: interfaceTheme === "toyota" ? "Mobility Decision Team" : interfaceTheme === "professional" ? "Customer Insight Team" : "Moonlit Griffin Quest Party",
        summary: `Assembled for: ${goal.slice(0, 120)}`,
        agents: getSampleAgentsForTheme(interfaceTheme, MOCK_AGENTS),
      },
      planner_source: "LLM",
      fallback_used: false,
    };
  }
  const res = await request<PlanTeamResponse>("/teams/plan", {
    method: "POST",
    body: JSON.stringify({ goal, interface_theme: interfaceTheme, max_team_size: 5, budget_preference: "balanced" }),
  });
  if (res.fallback_used === true) {
    throw new ApiRequestError("Planner returned a fallback team.");
  }
  return { ...res, team: { ...res.team, agents: normalizeAgents(res.team.agents) } };
}

// Proposed external backend contract: docs/QuestMaster_TEAM_BACKEND_PROMPTS.md.
// Mock teams are session-only, never presented as database persistence.
const mockTeams = new Map<string, SavedTeam>();

function normalizeSavedTeam(team: SavedTeam): SavedTeam {
  return { ...team, agents: normalizeAgents(team.agents) };
}

export async function getSavedTeams(): Promise<SavedTeam[]> {
  if (USE_MOCK) return [...mockTeams.values()];
  const res = await request<{ teams: SavedTeam[] }>("/teams");
  return res.teams.map(normalizeSavedTeam);
}

export async function getSavedTeam(id: string): Promise<SavedTeam> {
  if (USE_MOCK) {
    const team = mockTeams.get(id);
    if (!team) throw new Error("Team not found.");
    return structuredClone(team);
  }
  return normalizeSavedTeam((await request<{ team: SavedTeam }>(`/teams/${encodeURIComponent(id)}`)).team);
}

export async function saveTeam(input: SaveTeamInput, savedId?: string): Promise<SavedTeam> {
  const clean = { ...input, team: { ...input.team, agents: input.team.agents.map(({ portrait: _portrait, customized: _customized, ...agent }) => ({ ...agent, portrait: "" })) } };
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const team: SavedTeam = { ...clean.team, id: savedId ?? crypto.randomUUID(), goal: input.goal,
      interface_theme: input.interface_theme, created_at: (savedId ? mockTeams.get(savedId)?.created_at : undefined) ?? now,
      updated_at: now, last_run_status: "NEVER" };
    mockTeams.set(team.id, structuredClone(team));
    return normalizeSavedTeam(team);
  }
  const res = await request<{ team: SavedTeam }>(savedId ? `/teams/${encodeURIComponent(savedId)}` : "/teams", {
    method: savedId ? "PUT" : "POST", body: JSON.stringify(clean),
  });
  return normalizeSavedTeam(res.team);
}

export async function deleteSavedTeam(id: string): Promise<void> {
  if (USE_MOCK) { mockTeams.delete(id); return; }
  await request<void>(`/teams/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getDemoCustomers(): Promise<DemoCustomer[]> {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_CUSTOMERS;
  }
  const res = await request<{ customers: DemoCustomer[] }>("/demo/customers");
  return res.customers;
}

export async function getHealth(): Promise<{ status: string; service?: string; version?: string }> {
  return request<{ status: string; service?: string; version?: string }>("/health");
}

// ---- Mock run execution ----
// Simulates PLANNING → RUNNING → REVIEWING → COMPLETED with tasks
// transitioning over time. The real backend exposes the same flow via
// POST /api/runs (202 → { run_id, status: "PLANNING" }) + polling
// GET /api/runs/{run_id} until a terminal status.

const TASK_STEP_MS = 900;

interface MockRunState {
  run: Run;
  startedAt: number;
  customerId: string;
}

const mockRuns = new Map<string, MockRunState>();

function buildMockRun(goal: string): Run {
  const now = new Date().toISOString();
  return {
    run_id: `run-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "PLANNING",
    goal,
    created_at: now,
    updated_at: now,
    tasks: MOCK_RUN_TASKS.map((t) => ({ ...t })),
    metrics: { ...MOCK_METRICS, llm_calls: 0, estimated_ai_cost_usd: 0 },
    reward: null,
    log: [],
  };
}

function advanceMockRun(state: MockRunState): Run {
  const elapsed = Date.now() - state.startedAt;
  const step = Math.floor(elapsed / TASK_STEP_MS);
  const run = state.run;
  run.updated_at = new Date().toISOString();

  // Steps 0: PLANNING, 1..N: tasks completing one by one, then REVIEWING, COMPLETED.
  const totalSteps = run.tasks.length + 2;

  run.tasks.forEach((task: RunTask, i: number) => {
    let status: TaskStatus = "WAITING";
    if (step > i + 1) status = "COMPLETED";
    else if (step === i + 1) status = "RUNNING";
    task.status = status;
    if (status === "COMPLETED" && task.duration_ms === null) {
      task.duration_ms = 300 + Math.floor(Math.random() * 500);
    }
  });

  const completedCount = run.tasks.filter((t) => t.status === "COMPLETED").length;
  run.log = MOCK_LOG.slice(0, completedCount);
  run.metrics = {
    ...MOCK_METRICS,
    llm_calls: run.tasks.filter((t) => t.executor === "LLM" && t.status === "COMPLETED").length,
    estimated_ai_cost_usd:
      Math.round(
        run.tasks
          .filter((t) => t.status === "COMPLETED")
          .reduce((sum, t) => sum + t.cost_usd, 0) * 10000,
      ) / 10000,
  };

  let status: RunStatus = "PLANNING";
  if (step >= totalSteps) {
    status = "COMPLETED";
    run.reward = state.customerId === "customer-stressed" ? MOCK_REWARD_STRESSED : MOCK_REWARD;
    run.metrics = { ...MOCK_METRICS };
    run.log = [...MOCK_LOG];
  } else if (step >= run.tasks.length + 1) {
    status = "REVIEWING";
  } else if (step >= 1) {
    status = "RUNNING";
  }
  run.status = status;
  return run;
}

export async function createRun(input: CreateRunInput): Promise<{ run_id: string; status: RunStatus }> {
  if (USE_MOCK) {
    await delay(400);
    const run = buildMockRun(input.goal);
    mockRuns.set(run.run_id, { run, startedAt: Date.now(), customerId: input.customerId });
    return { run_id: run.run_id, status: run.status };
  }
  // API_SPEC §9: the backend expects the full payload — goal, the whole team
  // object from planTeam, and the demo customer in context. The 202 response
  // carries only { run_id, status: "PLANNING" }; the recommendation arrives
  // later via polling.
  return request<{ run_id: string; status: RunStatus }>("/runs", {
    method: "POST",
    body: JSON.stringify({
      goal: input.goal,
      team: input.team,
      context: { customer_id: input.customerId },
      quality_mode: "normal",
    }),
  });
}

export async function getRun(runId: string): Promise<Run> {
  if (USE_MOCK) {
    const state = mockRuns.get(runId);
    if (!state) throw new Error(`Unknown mock run: ${runId}`);
    await delay(120);
    return { ...advanceMockRun(state) };
  }
  const raw = await request<BackendRun>(`/runs/${runId}`);
  return normalizeRun(raw);
}

export async function getRuns(): Promise<RunSummary[]> {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_RUN_HISTORY;
  }
  const res = await request<{ runs: Partial<RunSummary>[] }>("/runs");
  return res.runs.map(normalizeRunSummary);
}

export function normalizeRunSummary(raw: Partial<RunSummary>): RunSummary {
  return {
    run_id: raw.run_id ?? "", goal: raw.goal ?? "", team_name: raw.team_name ?? "",
    status: raw.status ?? "PLANNING", result: raw.result ?? "", date: raw.date ?? "",
    duration_ms: finiteNumber(raw.duration_ms), estimated_ai_cost_usd: finiteNumber(raw.estimated_ai_cost_usd),
    llm_calls: finiteNumber(raw.llm_calls), llm_calls_avoided: finiteNumber(raw.llm_calls_avoided),
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeAuditEvent(event: AuditEvent, index = 0): LogEvent {
  const type = event.event_type ?? "";
  const category = /permission|security|data.?minimization|access|guardrail/i.test(type)
    ? "SECURITY" : /run_/i.test(type) ? "QUEST" : event.executor_type ?? "QUEST";
  return { id: event.id ?? `event-${index}`, timestamp: event.timestamp ?? "", category,
    message: event.message ?? type, actor: event.agent_name ?? event.agent_id ?? "Platform",
    event_type: type, ...(event.run_id ? { run_id: event.run_id } : {}) };
}

export async function getIntegrations(): Promise<Integration[]> {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_INTEGRATIONS;
  }
  const res = await request<{ integrations: Integration[] }>("/integrations");
  return res.integrations;
}

export async function getLogEvents(): Promise<LogEvent[]> {
  if (USE_MOCK) { await mockDelay(); return MOCK_LOG_EVENTS; }
  const res = await request<{ audit_events: AuditEvent[] }>("/audit-events?limit=200");
  return res.audit_events.map(normalizeAuditEvent);
}

export async function getSavedParties(): Promise<SavedParty[]> {
  if (USE_MOCK) { await mockDelay(); return MOCK_PARTIES; }
  throw new ApiRequestError("Legacy saved parties are unavailable in live mode. Use saved teams.");
}
