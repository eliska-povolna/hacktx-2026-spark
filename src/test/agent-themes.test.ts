import { describe, expect, it } from "vitest";
import { MOCK_AGENTS, PORTRAITS } from "@/api/mockData";
import { createCustomAgent, getAgentsForTheme, getPortrait } from "@/lib/theme";

describe("Agent identities across interface styles", () => {
  it("restores Fantasy portraits after Professional and Toyota", () => {
    for (const theme of ["professional", "toyota"] as const) {
      const themed = getAgentsForTheme(theme, MOCK_AGENTS);
      expect(themed[0]?.portrait).not.toBe(PORTRAITS.maya);
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