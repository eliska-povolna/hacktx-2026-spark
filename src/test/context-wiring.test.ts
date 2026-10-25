import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function liveApi(fetcher: typeof fetch) {
  vi.resetModules();
  vi.stubEnv("VITE_USE_MOCK_API", "false");
  vi.stubEnv("VITE_API_BASE_URL", "https://questmaster.tech/api");
  vi.stubGlobal("fetch", fetcher);
  return import("@/api/client");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("context wiring", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("loads context sources from the live catalog", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          sources: [
            {
              id: "toyota_customer",
              type: "builtin",
              label: "Toyota customer context",
              status: "ready",
              dismissible: true,
              description: "demo",
            },
          ],
        }),
      ),
    );
    const api = await liveApi(fetcher);
    const sources = await api.getContextSources();
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://questmaster.tech/api/context-sources");
    expect(sources[0]?.id).toBe("toyota_customer");
  });

  it("sends work_style as budget_preference and context_source_ids on plan", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          team: { id: "t", team_name: "Live", summary: "", agents: [] },
          fallback_used: false,
          planner_source: "LLM",
        }),
      ),
    );
    const api = await liveApi(fetcher);
    await api.planTeam("Plan a hospitality research crew", "fantasy", [], {
      context_source_ids: ["nessie_banking"],
      work_style: "thorough",
    });
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toMatchObject({
      budget_preference: "thorough",
      context_source_ids: ["nessie_banking"],
    });
  });

  it("preserves planner names in normalizeAgents", async () => {
    const api = await liveApi(vi.fn());
    const [agent] = api.normalizeAgents([
      { id: "a1", name: "Captain Marina", role: "Financial Analyst" },
    ]);
    expect(agent?.name).toBe("Captain Marina");
    expect(agent?.role).toBe("Financial Analyst");
  });
});
