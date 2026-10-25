import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_AGENTS } from "@/api/mockData";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("team generation and storage", () => {
  it("surfaces the planner's HTTP 503 message without a fallback team", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
      code: "LLM_UNAVAILABLE", message: "Planner unavailable. Please try again.", recoverable: true,
    } }), { status: 503 })));
    const { planTeam } = await import("@/api/client");
    await expect(planTeam("Map lunar beehives", "fantasy")).rejects.toMatchObject({
      displayMessage: "Planner unavailable. Please try again.",
    });
  });

  it("rejects HTTP 200 plans marked fallback_used=true", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      team: { id: "fallback", team_name: "Toyota default", agents: MOCK_AGENTS }, fallback_used: true,
    }), { status: 200 })));
    const { planTeam } = await import("@/api/client");
    await expect(planTeam("Map lunar beehives", "fantasy")).rejects.toThrow("Planner returned a fallback team.");
  });
  it("sends the actual goal and active interface to the external planner", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      team: { id: "planned", team_name: "Feedback", summary: "Feedback", agents: MOCK_AGENTS },
      planner_source: "LLM", fallback_used: false,
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const { planTeam } = await import("@/api/client");
    for (const theme of ["fantasy", "professional", "toyota"] as const) {
      await planTeam("Study guest feedback", theme);
      const args = fetcher.mock.calls.at(-1);
      expect(JSON.parse(args?.[1].body)).toEqual({ goal: "Study guest feedback", interface_theme: theme,
        max_team_size: 5, budget_preference: "balanced", attachment_ids: [] });
    }
  });

  it("saves edited definitions through POST and restores the live goal and agents", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    const summary = { id: "saved-1", name: "Feedback Team", purpose: "Study guest feedback", member_ids: ["maya"], estimated_cost_usd: 0.03, last_run_status: "NEVER" };
    const edited = { id: "planned-1", team_name: "Feedback Team", summary: "Hospitality", agents: MOCK_AGENTS.slice(0, 1).map((agent) => ({ ...agent, role: "Edited Analyst" })) };
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(summary), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ teams: [summary] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ summary, team: edited })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const { saveTeam, getSavedTeam, getSavedTeams, deleteSavedTeam } = await import("@/api/client");
    const saved = await saveTeam({ team: edited, goal: "Study guest feedback" });
    expect(saved.memberIds).toEqual(["maya"]);
    const body = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(Object.keys(body).sort()).toEqual(["goal", "team"]);
    expect(body).toMatchObject({ goal: "Study guest feedback", team: { id: "planned-1", agents: [{ role: "Edited Analyst" }] } });
    expect(fetcher.mock.calls[0]?.[1].method).toBe("POST");
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://questmaster.tech/api/teams");
    expect(await getSavedTeams()).toEqual([saved]);
    const loaded = await getSavedTeam(saved.id);
    expect(loaded.goal).toBe("Study guest feedback");
    expect(loaded.id).toBe("saved-1");
    expect(loaded.agents).toHaveLength(1);
    expect(loaded.agents[0]?.role).toBe("Edited Analyst");
    await deleteSavedTeam(saved.id);
    expect(fetcher.mock.calls[3]?.[1].method).toBe("DELETE");
    expect(fetcher.mock.calls[3]?.[0]).toBe("https://questmaster.tech/api/teams/saved-1");
    expect(storage).not.toHaveBeenCalled();
    storage.mockRestore();
  });

  it("surfaces live storage failures instead of returning mock parties", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));
    const { getSavedTeams } = await import("@/api/client");
    await expect(getSavedTeams()).rejects.toThrow("404 /teams");
  });
});