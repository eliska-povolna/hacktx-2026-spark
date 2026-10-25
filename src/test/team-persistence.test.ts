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
        max_team_size: 5, budget_preference: "balanced" });
    }
  });

  it("creates separate teams and reads edited configurations back without changing styles", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");
    const { saveTeam, getSavedTeam, getSavedTeams, deleteSavedTeam } = await import("@/api/client");
    const input = { team: { id: "planner-reused-id", team_name: "Feedback Team", summary: "Hospitality", agents: MOCK_AGENTS },
      goal: "Study guest feedback", interface_theme: "fantasy" as const };
    const first = await saveTeam(input);
    const second = await saveTeam(input);
    expect(first.id).not.toBe(second.id);
    expect(await getSavedTeams()).toHaveLength(2);
    await saveTeam({ ...input, team: { ...input.team, agents: input.team.agents.slice(0, 2).map((agent) => ({ ...agent, role: "Edited Analyst" })) } }, first.id);
    const loaded = await getSavedTeam(first.id);
    expect(loaded.goal).toBe("Study guest feedback");
    expect(loaded.interface_theme).toBe("fantasy");
    expect(loaded.agents).toHaveLength(2);
    expect(loaded.agents[0]?.role).toBe("Edited Analyst");
    await deleteSavedTeam(second.id);
    expect(await getSavedTeams()).toHaveLength(1);
  });

  it("surfaces live storage failures instead of returning mock parties", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));
    const { getSavedTeams } = await import("@/api/client");
    await expect(getSavedTeams()).rejects.toThrow("404 /teams");
  });
});