// Run-metric derivations for the Cost & Efficiency panel.
// All values come from run.metrics — nothing is hardcoded — and every
// computation is safe against missing or zero totals.

import type { RunMetrics } from "@/api/types";

// Percentage of AI calls avoided: avoided / (made + avoided).
export function computeAvoidedPct(metrics: RunMetrics): number {
  const total = metrics.llm_calls + metrics.llm_calls_avoided;
  if (total <= 0) return 0;
  return Math.round((metrics.llm_calls_avoided / total) * 100);
}

export interface TaskSplit {
  code: number;
  tool: number;
  llm: number;
  total: number;
}

// CODE / TOOL / LLM proportions from task counts (percentages sum to 100).
export function computeTaskSplit(metrics: RunMetrics): TaskSplit {
  const total = metrics.code_tasks + metrics.tool_tasks + metrics.llm_tasks;
  if (total <= 0) return { code: 0, tool: 0, llm: 0, total: 0 };
  const llm = Math.round((metrics.llm_tasks / total) * 100);
  const tool = Math.round((metrics.tool_tasks / total) * 100);
  return { code: 100 - llm - tool, tool, llm, total };
}
