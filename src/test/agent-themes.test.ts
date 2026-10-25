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

  it("classifies agents by function so the same role always gets the same portrait", () => {
    expect(classifyAgentFunction({ role: "Financial Context Analyst" })).toBe("maya");
    expect(classifyAgentFunction({ role: "Policy & Quality Reviewer" })).toBe("odo");
    expect(classifyAgentFunction({ role: "Research Analyst", skills: ["Web Search"] })).toBe("rowan");
    expect(classifyAgentFunction({ role: "Decision Specialist" })).toBe("selene");
    expect(classifyAgentFunction({ role: "Data Engineer", skills: ["ETL Pipelines"] })).toBe("kenji");
    expect(classifyAgentFunction({ role: "Customer Support Writer" })).toBe("amara");
    expect(classifyAgentFunction({ role: "Chaos Wizard" })).toBeNull();
  });

  it("keeps planner-chosen names and assigns portraits by function", () => {
    const planned = [
      { id: "agent_01", name: "Ledger Sage", role: "Financial Analyst" },
      { id: "agent_02", name: "Pipeline Smith", role: "Data Engineer" },
      { id: "agent_03", name: "Herald", role: "Customer Support Writer" },
    ];
    const agents = normalizeAgents(planned, "fantasy");
    expect(agents.map((agent) => agent.name)).toEqual(["Ledger Sage", "Pipeline Smith", "Herald"]);
    expect(agents.map((agent) => agent.role)).toEqual(["Financial Analyst", "Data Engineer", "Customer Support Writer"]);
    expect(agents[0]?.portrait).toBe(getPortrait("fantasy", "maya"));
    expect(agents[1]?.portrait).toBe(getPortrait("fantasy", "kenji"));
    expect(agents[2]?.portrait).toBe(getPortrait("fantasy", "amara"));
  });

  it("uses all seven identities for seven different functions", () => {
    const planned = [
      { id: "a1", name: "F1", role: "Financial Analyst" },
      { id: "a2", name: "F2", role: "Policy Reviewer" },
      { id: "a3", name: "F3", role: "Researcher" },
      { id: "a4", name: "F4", role: "Decision Strategist" },
      { id: "a5", name: "F5", role: "Software Engineer" },
      { id: "a6", name: "F6", role: "Support Communicator" },
      { id: "a7", name: "F7", role: "Operations Analyst" },
    ];
    for (const theme of ["fantasy", "professional", "toyota"] as const) {
      const agents = normalizeAgents(planned, theme);
      expect(agents.map((agent) => agent.name)).toEqual(["F1", "F2", "F3", "F4", "F5", "F6", "F7"]);
      expect(new Set(agents.map((agent) => agent.portrait)).size).toBe(7);
      expect(agents.map((agent) => agent.portrait)).toEqual([
        getPortrait(theme, "maya"),
        getPortrait(theme, "odo"),
        getPortrait(theme, "rowan"),
        getPortrait(theme, "selene"),
        getPortrait(theme, "kenji"),
        getPortrait(theme, "amara"),
        getPortrait(theme, "brann"),
      ]);
    }
  });

  it("assigns live-planned agents portraits by function, not by hash", () => {
    const planned = [
      { id: "agent_01", name: "Ledger Sage", role: "Financial Analyst", skills: ["Budgeting"] },
      { id: "agent_02", name: "Compliance Warden", role: "Policy Reviewer", skills: ["Validation"] },
      { id: "agent_03", name: "Pathfinder", role: "Researcher", skills: ["Web Research"] },
    ];
    for (const theme of ["fantasy", "professional", "toyota"] as const) {
      const agents = normalizeAgents(planned, theme);
      expect(agents[0]?.portrait).toBe(getPortrait(theme, "maya"));
      expect(agents[1]?.portrait).toBe(getPortrait(theme, "odo"));
      expect(agents[2]?.portrait).toBe(getPortrait(theme, "rowan"));
    }
  });

  it("keeps portraits distinct when two agents share one function", () => {
    const planned = [
      { id: "agent_01", name: "Budget Keeper", role: "Financial Analyst" },
      { id: "agent_02", name: "Cost Watcher", role: "Finance Reviewer" },
    ];
    const agents = normalizeAgents(planned, "fantasy");
    expect(agents[0]?.portrait).toBe(getPortrait("fantasy", "maya"));
    expect(agents[1]?.portrait).toBeTruthy();
    expect(agents[1]?.portrait).not.toBe(agents[0]?.portrait);
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