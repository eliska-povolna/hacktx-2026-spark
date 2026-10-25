import { describe, expect, it } from "vitest";

import { computeAvoidedPct, computeTaskSplit } from "@/lib/metrics";
import type { RunMetrics } from "@/api/types";

const base: RunMetrics = {
  llm_calls: 0,
  llm_calls_avoided: 0,
  input_tokens: 0,
  output_tokens: 0,
  estimated_ai_cost_usd: 0,
  estimated_baseline_cost_usd: 0,
  estimated_cost_saved_usd: 0,
  code_tasks: 0,
  tool_tasks: 0,
  llm_tasks: 0,
};

describe("run metric derivations", () => {
  it("computes AI calls avoided from real metrics", () => {
    expect(computeAvoidedPct({ ...base, llm_calls: 2, llm_calls_avoided: 14 })).toBe(88);
  });

  it("never divides by zero when no calls were made", () => {
    expect(computeAvoidedPct(base)).toBe(0);
  });

  it("splits CODE / TOOL / LLM proportions from task counts", () => {
    const split = computeTaskSplit({ ...base, code_tasks: 1, tool_tasks: 3, llm_tasks: 2 });
    expect(split).toEqual({ code: 17, tool: 50, llm: 33, total: 6 });
    expect(split.code + split.tool + split.llm).toBe(100);
  });

  it("returns a zero split for a run without tasks", () => {
    expect(computeTaskSplit(base)).toEqual({ code: 0, tool: 0, llm: 0, total: 0 });
  });
});
