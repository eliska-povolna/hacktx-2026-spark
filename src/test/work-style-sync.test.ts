import { describe, expect, it } from "vitest";

/**
 * Saved-team work_style must follow the UI selector, not a stale plannedTeam.policy.
 * Mirrors create.tsx saveChanges / work-style onChange policy merge.
 */
function withWorkStyle<T extends { policy?: Record<string, unknown> }>(
  team: T,
  workStyle: "fast" | "balanced" | "thorough",
) {
  return {
    ...team,
    policy: {
      ...team.policy,
      max_llm_calls: (team.policy?.max_llm_calls as number | undefined) ?? 6,
      max_llm_cost_usd: (team.policy?.max_llm_cost_usd as number | undefined) ?? 0.2,
      work_style: workStyle,
      guardrails: (team.policy?.guardrails as string[] | undefined) ?? [],
    },
  };
}

describe("work style sync", () => {
  it("save payload uses the current selector even when planned policy is stale", () => {
    const planned = {
      id: "t1",
      team_name: "Mobility",
      summary: "",
      agents: [],
      policy: {
        workflow_kind: "mobility_decision",
        scope: "single_customer",
        work_style: "balanced",
        max_llm_calls: 4,
        max_llm_cost_usd: 0.1,
        guardrails: ["x"],
      },
    };
    const saved = withWorkStyle(planned, "thorough");
    expect(saved.policy.work_style).toBe("thorough");
    expect(saved.policy.max_llm_calls).toBe(4);
    expect(saved.policy.workflow_kind).toBe("mobility_decision");
  });

  it("changing the selector updates the in-memory team policy before save", () => {
    let team = {
      id: "t1",
      policy: { work_style: "balanced" as const, max_llm_calls: 6, max_llm_cost_usd: 0.2, guardrails: [] as string[] },
    };
    team = withWorkStyle(team, "fast");
    expect(team.policy.work_style).toBe("fast");
  });
});
