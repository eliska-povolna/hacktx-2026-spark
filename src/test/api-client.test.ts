import { describe, expect, it } from "vitest";

import { normalizeAgents, normalizeRun } from "@/api/client";
import { PORTRAITS } from "@/api/mockData";
import type { BackendRun } from "@/api/types";

// Backend run response fixture mirroring docs/QuestMaster_API_SPEC.md §10.
const BACKEND_RUN_COMPLETED: BackendRun = {
  run_id: "run-001",
  status: "COMPLETED",
  goal: "Determine this customer's smartest next mobility decision.",
  created_at: "2026-10-25T02:03:00Z",
  updated_at: "2026-10-25T02:04:33Z",
  tasks: [
    {
      id: "load-financial-data",
      name: "Load banking data",
      assigned_agent_id: "financial-agent",
      executor: "TOOL",
      action: "nessie_load_customer_financials",
      status: "COMPLETED",
      activity_summary: "Retrieved financial data from Nessie.",
      tool: "nessie_accounts",
      duration_ms: 420,
      cost_usd: 0,
      data_source: "NESSIE_LIVE",
    },
  ],
  metrics: {
    llm_calls: 1,
    llm_calls_avoided: 4,
    input_tokens: 1230,
    output_tokens: 311,
    estimated_ai_cost_usd: 0.0048,
    estimated_baseline_cost_usd: 0.028,
    estimated_cost_saved_usd: 0.0232,
    code_tasks: 2,
    tool_tasks: 2,
    llm_tasks: 1,
  },
  recommendation: {
    recommended_action: "BUY_CURRENT_VEHICLE",
    confidence: 0.91,
    headline: "Buying your current RAV4 is your strongest option.",
    summary: "Your current vehicle still fits your needs and is within your safe mobility budget.",
    reasons: ["The estimated monthly payment stays below your safe mobility budget."],
  },
  audit_events: [
    {
      id: "evt-001",
      timestamp: "2026-10-25T02:03:11Z",
      event_type: "TOOL_CALL",
      executor_type: "TOOL",
      message: "Retrieved account data from Nessie.",
    },
  ],
};

describe("normalizeRun", () => {
  it("maps the backend recommendation onto the frontend reward", () => {
    const run = normalizeRun(BACKEND_RUN_COMPLETED);
    expect(run.reward).not.toBeNull();
    expect(run.reward?.title).toBe("Buying your current RAV4 is your strongest option.");
    expect(run.reward?.confidence).toBe(0.91);
    expect(run.reward?.reasons).toHaveLength(1);
  });

  it("maps audit events onto the frontend log with HH:MM:SS timestamps", () => {
    const run = normalizeRun(BACKEND_RUN_COMPLETED);
    expect(run.log).toHaveLength(1);
    expect(run.log[0]?.timestamp).toBe("02:03:11");
    expect(run.log[0]?.executor).toBe("TOOL");
  });

  it("defaults missing task fields so the UI never crashes on sparse tasks", () => {
    const run = normalizeRun({
      ...BACKEND_RUN_COMPLETED,
      tasks: [{ id: "t1", name: "Sparse task" }],
    });
    expect(run.tasks[0]?.status).toBe("WAITING");
    expect(run.tasks[0]?.depends_on).toEqual([]);
    expect(run.tasks[0]?.duration_ms).toBeNull();
  });

  it("keeps reward null while the run has no recommendation yet", () => {
    const run = normalizeRun({ ...BACKEND_RUN_COMPLETED, status: "RUNNING", recommendation: null });
    expect(run.reward).toBeNull();
  });
});

describe("normalizeAgents", () => {
  it("assigns a bundled jpg to live agents with unfamiliar IDs and names", () => {
    const agents = normalizeAgents([{ id: "agent_navigator_01", name: "Captain Marina" }, { name: "Lunar Beekeeper" }]);
    expect(agents).toHaveLength(2);
    for (const agent of agents) expect(agent.portrait).toMatch(/\.jpg(?:\?|$)/);
  });
  it("fills the portrait from the local set and description from purpose", () => {
    const [maya] = normalizeAgents([
      {
        id: "financial-agent",
        name: "Maya",
        role: "Financial Context Analyst",
        purpose: "Determine what mobility options are financially safe.",
        skills: ["cashflow_analysis"],
        allowed_tools: ["nessie_accounts"],
        permissions: { data_scopes: ["financial_summary"], actions: ["read"] },
        budget: { max_llm_cost_usd: 0.05, max_llm_calls: 1 },
      },
    ]);
    expect(maya?.portrait).toBe(PORTRAITS["maya"]);
    expect(maya?.description).toBe("Determine what mobility options are financially safe.");
    expect(maya?.model_policy).toBe("auto");
  });
});
