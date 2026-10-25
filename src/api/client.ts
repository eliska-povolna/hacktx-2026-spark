// Centralized QuestMaster API service layer.
// Components must call ONLY these functions — never fetch() directly.
//
// Mock mode is on by default. To switch to the real backend:
//   VITE_USE_MOCK_API=false
//   VITE_API_BASE_URL=https://questmaster.tech/api

import {
  MOCK_AGENTS,
  MOCK_INTEGRATIONS,
  MOCK_LOG,
  MOCK_LOG_EVENTS,
  MOCK_METRICS,
  MOCK_PARTIES,
  MOCK_REWARD,
  MOCK_RUN_HISTORY,
  MOCK_RUN_TASKS,
} from "./mockData";
import type {
  DemoSession,
  Integration,
  LogEvent,
  PlanTeamResponse,
  Run,
  RunStatus,
  RunSummary,
  RunTask,
  SavedParty,
  TaskStatus,
} from "./types";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockDelay() {
  return delay(300 + Math.random() * 600);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}

export function isMockMode(): boolean {
  return USE_MOCK;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function createDemoSession(): Promise<DemoSession> {
  if (USE_MOCK) {
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
  return request<DemoSession>("/demo-session", { method: "POST", body: "{}" });
}

export async function planTeam(goal: string): Promise<PlanTeamResponse> {
  if (USE_MOCK) {
    await mockDelay();
    return {
      team: {
        id: "generated-team-001",
        team_name: "Moonlit Griffin Quest Party",
        summary: `Assembled for: ${goal.slice(0, 120)}`,
        agents: MOCK_AGENTS,
      },
      planner_source: "LLM",
      fallback_used: false,
    };
  }
  return request<PlanTeamResponse>("/teams/plan", {
    method: "POST",
    body: JSON.stringify({ goal, max_team_size: 5, budget_preference: "balanced" }),
  });
}

// ---- Mock run execution ----
// Simulates PLANNING → RUNNING → REVIEWING → COMPLETED with tasks
// transitioning over time. The real backend will expose the same shape
// via POST /api/runs + polling GET /api/runs/:run_id.

const TASK_STEP_MS = 900;

interface MockRunState {
  run: Run;
  startedAt: number;
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
    run.reward = MOCK_REWARD;
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

export async function createRun(goal: string): Promise<{ run_id: string; status: RunStatus }> {
  if (USE_MOCK) {
    await delay(400);
    const run = buildMockRun(goal);
    mockRuns.set(run.run_id, { run, startedAt: Date.now() });
    return { run_id: run.run_id, status: run.status };
  }
  return request<{ run_id: string; status: RunStatus }>("/runs", {
    method: "POST",
    body: JSON.stringify({ goal, quality_mode: "normal" }),
  });
}

export async function getRun(runId: string): Promise<Run> {
  if (USE_MOCK) {
    const state = mockRuns.get(runId);
    if (!state) throw new Error(`Unknown mock run: ${runId}`);
    await delay(120);
    return { ...advanceMockRun(state) };
  }
  return request<Run>(`/runs/${runId}`);
}

export async function getRuns(): Promise<RunSummary[]> {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_RUN_HISTORY;
  }
  const res = await request<{ runs: RunSummary[] }>("/runs");
  return res.runs;
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
  // Frontend-only for now; the real backend exposes audit events per run.
  await mockDelay();
  return MOCK_LOG_EVENTS;
}

export async function getSavedParties(): Promise<SavedParty[]> {
  // Frontend-only for now; parties persist in component state.
  await mockDelay();
  return MOCK_PARTIES;
}
