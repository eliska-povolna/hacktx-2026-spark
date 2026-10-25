import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDuration, formatMoney, humanize } from "@/lib/result-format";
import { normalizeAuditEvent, normalizeRun, normalizeRunSummary } from "@/api/client";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("live data must never silently fall back", () => {
  it.each(["getRuns", "getLogEvents", "getIntegrations", "getSavedTeams"] as const)("%s rejects a failed live request", async (method) => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })));
    const api = await import("@/api/client");
    await expect(api[method]()).rejects.toThrow("503");
  });
  it("live Activity requests the audit endpoint and preserves backend identity", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ audit_events: [{ id: "audit-real", timestamp: "2026-10-25T07:00:00Z", event_type: "TOOL_CALL", executor_type: "TOOL", agent_name: "Maya", run_id: "run-real", message: "Nessie responded" }] })));
    vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    const events = await api.getLogEvents();
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://questmaster.tech/api/audit-events?limit=200");
    expect(events[0]).toMatchObject({ id: "audit-real", category: "TOOL", actor: "Maya", run_id: "run-real", timestamp: "2026-10-25T07:00:00Z" });
  });
  it("legacy parties cannot fabricate live account data", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const api = await import("@/api/client");
    await expect(api.getSavedParties()).rejects.toThrow("unavailable in live mode");
  });
  it("explicit mock mode still provides fixtures without contacting the backend", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    expect((await api.getRuns()).length).toBeGreaterThan(0);
    expect((await api.getLogEvents()).length).toBeGreaterThan(0);
    expect((await api.getIntegrations()).length).toBeGreaterThan(0);
    expect((await api.getSavedParties()).length).toBeGreaterThan(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("backend result preservation", () => {
  it("keeps recommendation options, next step, financial context and non-pass evaluators", () => {
    const recommendation = { recommended_action: "RETURN_VEHICLE", confidence: 0.9, headline: "Return", summary: "Protect reserves", reasons: ["High stress"], assumptions: ["Synthetic terms"], next_step: { label: "Review lease-end options", action_type: "FOLLOW_UP" }, options: [{ label: "Return", monthly_cost: 0, three_year_cost: 0, fit_score: 100, safe_for_budget: true, tradeoffs: ["No car"] }] };
    const financial_context = { financial_stress: "HIGH", safe_mobility_budget: 390, emergency_runway_months: 0.9, monthly_free_cashflow: 700, cash_reserve: 1100 };
    const evaluators = [{ name: "budget", status: "WARN" }, { name: "permissions", status: "FAIL" }];
    const run = normalizeRun({ run_id: "r", status: "COMPLETED", goal: "Mobility", created_at: "", updated_at: "", recommendation, financial_context, evaluators, tasks: [{ data_source: "NESSIE_LIVE" }] });
    expect(run.recommendation).toEqual(recommendation);
    expect(run.financial_context).toEqual(financial_context);
    expect(run.evaluators).toEqual(evaluators);
    expect(run.tasks[0]?.data_source).toBe("NESSIE_LIVE");
  });
  it.each(["PERMISSION_CHECK", "SECURITY_POLICY", "DATA_MINIMIZATION"])("maps %s to Security even when CODE executed it", (event_type) => {
    expect(normalizeAuditEvent({ id: "e", timestamp: "", message: "Check", executor_type: "CODE", event_type }).category).toBe("SECURITY");
  });
  it("maps run lifecycle events to QUEST", () => {
    expect(normalizeAuditEvent({ id: "e", timestamp: "", message: "Done", executor_type: "CODE", event_type: "RUN_COMPLETED" }).category).toBe("QUEST");
  });
  it("does not invent missing historical metrics", () => {
    const summary = normalizeRunSummary({ run_id: "r", duration_ms: NaN, estimated_ai_cost_usd: Infinity });
    expect(summary.duration_ms).toBeNull(); expect(summary.estimated_ai_cost_usd).toBeNull(); expect(summary.llm_calls_avoided).toBeNull();
  });
  it("formats backend costs, duration, dates and action enums safely", () => {
    expect(formatMoney(0.0045)).toBe("$0.0045"); expect(formatMoney(null)).toBe("Unavailable");
    expect(formatDuration(93200)).toBe("1m 33s"); expect(formatDuration(NaN)).toBe("Unavailable");
    expect(formatDate("invalid")).toBe("Unavailable"); expect(formatDate("2026-10-25T07:00:00Z")).toBe("Oct 25, 2026");
    expect(humanize("BUY_CURRENT_VEHICLE")).toBe("Buy Current Vehicle"); expect(humanize("RETURN_VEHICLE")).toBe("Return Vehicle");
  });
});