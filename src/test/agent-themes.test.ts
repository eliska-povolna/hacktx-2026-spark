import { describe, expect, it } from "vitest";
import { MOCK_AGENTS, PORTRAITS } from "@/api/mockData";
import { normalizeAgents } from "@/api/client";
import { classifyAgentFunction, createCustomAgent, getAgentsForTheme, getPortrait } from "@/lib/theme";

describe("Agent identities across interface styles", () => {
  it("keeps live portrait identities stable across team order and uses each theme's jpg pool", () => {
    const live = ["agent_navigator_01", "agent_lunar_beekeeper_02"];
    for (const id of live) {
      const portraits = ["fantasy", "professional", "toyota"].map((theme) => getPortrait(theme as "fantasy" | "professional" | "toyota", id));
      expect(new Set(portraits).size).toBe(3);
      for (const portrait of portraits) expect(portrait).toMatch(/\.jpg(?:\?|$)/);
    }
    const agents = live.map((id) => ({ ...createCustomAgent([]), id, name: id }));
    expect(getAgentsForTheme("toyota", [...agents].reverse()).map((a) => a.portrait).reverse())
      .toEqual(getAgentsForTheme("toyota", agents).map((a) => a.portrait));
    expect(getPortrait("professional", "unknown-id", "Maya")).toBe(getPortrait("professional", "maya"));
  });
  it("preserves every generated configuration field across all interfaces", () => {
    const original = MOCK_AGENTS[0];
    if (!original) throw new Error("Missing agent fixture");
    const generated = [{ ...original, id: "maya", name: "Generated Feedback Analyst", role: "Hospitality Analyst",
      skills: ["Guest feedback"], allowed_tools: ["feedback_reader"],
      permissions: { data_scopes: ["guest_feedback"], actions: ["read"] } }];
    for (const theme of ["fantasy", "professional", "toyota"] as const) {
      const shown = getAgentsForTheme(theme, generated);
      expect(shown.map(({ portrait: _portrait, ...agent }) => agent))
        .toEqual(generated.map(({ portrait: _portrait, ...agent }) => agent));
    }
  });
  it("restores Fantasy portraits after Professional and Toyota", () => {
    for (const theme of ["professional", "toyota"] as const) {
      const themed = getAgentsForTheme(theme, MOCK_AGENTS);
      expect(themed[0]?.portrait).not.toBe(PORTRAITS["maya"]);
      const fantasy = getAgentsForTheme("fantasy", themed);
      expect(fantasy.map((agent) => agent.portrait)).toEqual(MOCK_AGENTS.map((agent) => agent.portrait));
    }
  });

  it("prepares two additional agents with distinct names and portraits in every style", () => {
    const first = createCustomAgent(MOCK_AGENTS);
    const second = createCustomAgent([...MOCK_AGENTS, first]);
    expect(first.name).toBe("Amara");
    expect(second.name).toBe("Kenji");
    expect(first.id).not.toBe(second.id);
    for (const theme of ["fantasy", "professional", "toyota"] as const) {
      const portraits = [first, second].map((agent) => getPortrait(theme, agent.id));
      expect(portraits.every(Boolean)).toBe(true);
      expect(new Set([...MOCK_AGENTS.map((agent) => getPortrait(theme, agent.id)), ...portraits]).size).toBe(7);
    }
  });

  it("preserves custom agents, edits and removals when presenting Toyota", () => {
    const custom = { ...createCustomAgent(MOCK_AGENTS), name: "Edited Amara", skills: ["Custom research"] };
    const team = [...MOCK_AGENTS.filter((agent) => agent.id !== "odo"), custom];
    for (const theme of ["toyota", "professional", "fantasy"] as const) {
      const displayed = getAgentsForTheme(theme, team);
      expect(displayed.map((agent) => agent.id)).toEqual(team.map((agent) => agent.id));
      expect(displayed.at(-1)?.name).toBe("Edited Amara");
      expect(displayed.at(-1)?.skills).toEqual(["Custom research"]);
      expect(displayed.at(-1)?.portrait).toBe(getPortrait(theme, custom.id));
    }
    expect(team[0]?.role).toBe("Financial Analyst");
  });
});