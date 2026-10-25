import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("Tiger saved teams", () => {
  it("duplicates a full restored definition through POST with a new ID", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const summary = { id: "original", name: "Research", purpose: "Review feedback", member_ids: ["analyst"], estimated_cost_usd: 0.04, last_run_status: "NEVER" };
    const team = { id: "original", team_name: "Research", summary: "Feedback analysis", agents: [{ id: "analyst", name: "Analyst", role: "Researcher", allowed_tools: ["document_search"], permissions: { data_scopes: ["feedback"], actions: ["read"] } }] };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ summary, team })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...summary, id: "copy-id", name: "Research (Copy)" }), { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    const original = await api.getSavedTeam("original");
    const copied = await api.saveTeam({ goal: original.goal, team: { ...original, id: "copy-id", team_name: `${original.team_name} (Copy)` } });
    expect(copied.id).not.toBe(original.id);
    const payload = JSON.parse(fetcher.mock.calls[1]?.[1].body);
    expect(payload).toMatchObject({ goal: "Review feedback", team: { id: "copy-id", team_name: "Research (Copy)", agents: [{ allowed_tools: ["document_search"], permissions: { data_scopes: ["feedback"], actions: ["read"] } }] } });
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://questmaster.tech/api/teams");
    expect(fetcher.mock.calls[1]?.[1].method).toBe("POST");
  });

  it.each(["save", "delete"])("preserves the API error message for %s", async (action) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Tiger is temporarily unavailable" } }), { status: 503 }));
    vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    const result = action === "delete" ? api.deleteSavedTeam("team-1") : api.saveTeam({ goal: "Analysis", team: { id: "team-1", team_name: "Analysis", summary: "", agents: [] } });
    await expect(result).rejects.toThrow("Tiger is temporarily unavailable");
  });

  it("never substitutes mock saved teams even with unrelated mock APIs enabled", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ teams: [] })));
    vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    expect(await api.getSavedParties()).toEqual([]);
    expect(fetcher).toHaveBeenCalledWith("https://questmaster.tech/api/teams", expect.any(Object));
  });
});
describe("saved team policy round-trip", () => {
  it("preserves workflow, scope, work style and explicit zero budgets through save and restore", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const policy = { workflow_kind: "loan_opportunity", scope: "portfolio", work_style: "thorough" as const, max_llm_calls: 0, max_llm_cost_usd: 0, guardrails: ["Derived data only"] };
    const summary = { id: "portfolio", name: "Loans", purpose: "Loan opportunity", member_ids: [], estimated_cost_usd: 0, last_run_status: "NEVER" };
    let stored: unknown;
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      if (init?.method === "POST") {
        stored = JSON.parse(String(init.body)).team;
        return new Response(JSON.stringify(summary), { status: 201 });
      }
      return new Response(JSON.stringify({ summary, team: stored }));
    });
    vi.stubGlobal("fetch", fetcher);
    const api = await import("@/api/client");
    await api.saveTeam({ goal: "Loan opportunity", team: { id: "portfolio", team_name: "Loans", summary: "", agents: [], policy } });
    const restored = await api.getSavedTeam("portfolio");
    expect(restored.policy).toEqual(policy);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)).team.policy).toEqual(policy);
  });
});
