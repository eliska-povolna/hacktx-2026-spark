import type {
  AgentDefinition,
  DemoCustomer,
  Integration,
  LogEvent,
  QuestLogEntry,
  QuestReward,
  RunMetrics,
  RunSummary,
  RunTask,
  SavedParty,
} from "./types";

import portraitMaya from "@/assets/portrait-maya.jpg";
import portraitRowan from "@/assets/portrait-rowan.jpg";
import portraitBrann from "@/assets/portrait-brann.jpg";
import portraitSelene from "@/assets/portrait-selene.jpg";
import portraitOdo from "@/assets/portrait-odo.jpg";

export const PORTRAITS: Record<string, string> = {
  maya: portraitMaya,
  rowan: portraitRowan,
  brann: portraitBrann,
  selene: portraitSelene,
  odo: portraitOdo,
};

export const MOCK_AGENTS: AgentDefinition[] = [
  {
    id: "maya",
    name: "Maya",
    role: "Financial Analyst",
    purpose: "Turn data into practical recommendations for profitable, sustainable growth.",
    description:
      "Analyzes business context, evaluates financial impact and affordability, identifies risks and opportunities, and builds clear, actionable recommendations.",
    skills: ["Financial Analysis", "Affordability Modeling", "Forecasting", "Risk Assessment"],
    instructions: "Use only approved tools and data scopes.",
    allowed_tools: ["Ledger Reader", "Scroll Archive", "Trend Scrying", "Cost Calculator", "Report Builder"],
    permissions: {
      data_scopes: ["guest_feedback", "ledger_data", "competitor_notes", "guild_policies"],
      actions: ["read", "calculate", "create_reports"],
    },
    guardrails: [
      "Follow data privacy rules",
      "Stay within budget limits",
      "Avoid speculative claims",
      "Cite sources for key data",
    ],
    model_policy: "Use LLM for reasoning. Prefer tools and code first.",
    budget: { max_llm_cost_usd: 1.5, max_llm_calls: 4 },
    estimated_cost_usd: 0.12,
    portrait: portraitMaya,
  },
  {
    id: "rowan",
    name: "Rowan",
    role: "Context Scout",
    purpose: "Range ahead of the party to gather the context others will need.",
    description:
      "Scouts external sources, gathers raw context from the wilds of the web and your archives, and returns with concise, trustworthy briefings.",
    skills: ["Research", "Data Gathering", "Web Search", "Summarize"],
    instructions: "Prefer primary sources. Summarize, don't dump.",
    allowed_tools: ["Web Search", "Scroll Archive", "Compass Queries"],
    permissions: {
      data_scopes: ["guest_feedback", "competitor_notes"],
      actions: ["read", "synthesize"],
    },
    guardrails: ["Cite every source", "Flag low-confidence findings"],
    model_policy: "Tools first; LLM only for summarization.",
    budget: { max_llm_cost_usd: 0.8, max_llm_calls: 3 },
    estimated_cost_usd: 0.07,
    portrait: portraitRowan,
  },
  {
    id: "brann",
    name: "Brann",
    role: "Operations Strategist",
    purpose: "Turn analysis into an operational plan that survives contact with reality.",
    description:
      "A veteran tactician who maps processes, spots bottlenecks, and designs operational improvements that hold up under pressure.",
    skills: ["Operations", "Process Design", "Pattern Recognition", "Optimization"],
    instructions: "Favor simple, repeatable processes.",
    allowed_tools: ["Process Mapper", "Cost Calculator", "Pattern Lens"],
    permissions: {
      data_scopes: ["ledger_data", "guild_policies"],
      actions: ["read", "calculate", "recommend"],
    },
    guardrails: ["No changes without Quest Master approval", "Stay within budget limits"],
    model_policy: "Code and tools for computation; LLM for planning.",
    budget: { max_llm_cost_usd: 1.0, max_llm_calls: 3 },
    estimated_cost_usd: 0.09,
    portrait: portraitBrann,
  },
  {
    id: "selene",
    name: "Selene",
    role: "Decision Mage",
    purpose: "Weigh every path and divine the one most worth walking.",
    description:
      "A mystic strategist who models trade-offs, scores options against your goals, and weaves the party's findings into a single clear recommendation.",
    skills: ["Modeling", "Trade-offs", "Recommendations", "Strategy"],
    instructions: "Always present alternatives with trade-offs.",
    allowed_tools: ["Decision Loom", "Trend Scrying", "Report Builder"],
    permissions: {
      data_scopes: ["financial_summary", "competitor_notes"],
      actions: ["read", "synthesize", "recommend"],
    },
    guardrails: ["Show confidence levels", "Never hide uncertainty"],
    model_policy: "LLM for synthesis and reasoning.",
    budget: { max_llm_cost_usd: 1.2, max_llm_calls: 4 },
    estimated_cost_usd: 0.1,
    portrait: portraitSelene,
  },
  {
    id: "odo",
    name: "Odo",
    role: "Reviewer",
    purpose: "Guard the party's work against error, risk, and policy breaches.",
    description:
      "A patient guardian who reviews every output for correctness, safety, and policy compliance before it reaches your hands.",
    skills: ["Validation", "Safety", "Policy", "Quality"],
    instructions: "Reject anything unsourced or unsafe.",
    allowed_tools: ["Policy Codex", "Validation Scales"],
    permissions: {
      data_scopes: ["guild_policies", "financial_summary"],
      actions: ["read", "validate"],
    },
    guardrails: ["Block unverified claims", "Enforce guild policies"],
    model_policy: "Deterministic checks first; LLM for judgment calls.",
    budget: { max_llm_cost_usd: 0.6, max_llm_calls: 2 },
    estimated_cost_usd: 0.04,
    portrait: portraitOdo,
  },
];

export const MOCK_RUN_TASKS: RunTask[] = [
  {
    id: "read-feedback",
    name: "Read guest feedback",
    assigned_agent_id: "rowan",
    executor: "TOOL",
    action: "read_guest_feedback",
    depends_on: [],
    risk_level: "low",
    status: "WAITING",
    activity_summary: "Reading guest feedback from reviews.",
    tool: "Scroll Archive",
    duration_ms: null,
    cost_usd: 0,
    data_source: "CACHE",
  },
  {
    id: "gather-ledger",
    name: "Gather ledger data",
    assigned_agent_id: "maya",
    executor: "TOOL",
    action: "gather_ledger_data",
    depends_on: [],
    risk_level: "medium",
    status: "WAITING",
    activity_summary: "Gathering ledger data (revenue, bookings).",
    tool: "Ledger Reader",
    duration_ms: null,
    cost_usd: 0,
    data_source: "LOCAL_CODE",
  },
  {
    id: "price-sensitivity",
    name: "Calculate price sensitivity",
    assigned_agent_id: "maya",
    executor: "CODE",
    action: "calculate_price_sensitivity",
    depends_on: ["gather-ledger"],
    risk_level: "low",
    status: "WAITING",
    activity_summary: "Calculating price sensitivity with local code.",
    tool: null,
    duration_ms: null,
    cost_usd: 0,
    data_source: "LOCAL_CODE",
  },
  {
    id: "compare-competitors",
    name: "Compare competitor offers",
    assigned_agent_id: "rowan",
    executor: "TOOL",
    action: "compare_competitor_offers",
    depends_on: ["read-feedback"],
    risk_level: "low",
    status: "WAITING",
    activity_summary: "Comparing competitor offers.",
    tool: "Compass Queries",
    duration_ms: null,
    cost_usd: 0,
    data_source: "CACHE",
  },
  {
    id: "synthesize",
    name: "Synthesize recommendations",
    assigned_agent_id: "selene",
    executor: "LLM",
    action: "synthesize_recommendations",
    depends_on: ["price-sensitivity", "compare-competitors"],
    risk_level: "medium",
    status: "WAITING",
    activity_summary: "Synthesizing recommendations.",
    tool: null,
    duration_ms: null,
    cost_usd: 0.0031,
    data_source: "LLM",
  },
  {
    id: "draft-report",
    name: "Draft final report",
    assigned_agent_id: "odo",
    executor: "LLM",
    action: "draft_final_report",
    depends_on: ["synthesize"],
    risk_level: "low",
    status: "WAITING",
    activity_summary: "Drafting the final report.",
    tool: null,
    duration_ms: null,
    cost_usd: 0.0017,
    data_source: "LLM",
  },
];

export const MOCK_REWARD: QuestReward = {
  id: "out-001",
  title: "Prioritize weekend bundles",
  confidence: 0.92,
  summary:
    "Introduce a weekend stay + dining bundle to improve occupancy, increase average spend, and drive more repeat visits.",
  reasons: [
    "Strong demand in guest feedback",
    "Positive estimated revenue impact (est. +18%)",
    "Supports higher repeat visit rate",
  ],
};

// Mock twin of the backend's stressed-customer recommendation
// (customer-stable → BUY_CURRENT_VEHICLE, customer-stressed → RETURN_VEHICLE).
export const MOCK_REWARD_STRESSED: QuestReward = {
  id: "out-toyota-002",
  title: "Recommended Next Move: Return Vehicle",
  confidence: 0.88,
  summary:
    "With a weaker financial buffer, returning the vehicle at lease end and switching to a flexible mobility plan is the safest next step.",
  reasons: [
    "The monthly payment exceeds the safe mobility budget",
    "Emergency runway is under two months",
    "Usage has dropped, so a flexible plan costs less",
  ],
};

export const MOCK_CUSTOMERS: DemoCustomer[] = [
  {
    id: "customer-stable",
    name: "Sarah Miller",
    vehicle: "2023 Toyota RAV4",
    scenario_label: "Financially stable",
    description: "Strong reserve and stable cash flow.",
  },
  {
    id: "customer-stressed",
    name: "Jordan Lee",
    vehicle: "2023 Toyota RAV4",
    scenario_label: "Financially constrained",
    description: "Same vehicle context, weaker financial buffer.",
  },
];

export const MOCK_LOG: QuestLogEntry[] = [
  { id: "log-1", timestamp: "10:14:02", message: "Read guest feedback from reviews", executor: "TOOL" },
  { id: "log-2", timestamp: "10:14:05", message: "Gather ledger data (revenue, bookings)", executor: "TOOL" },
  { id: "log-3", timestamp: "10:14:09", message: "Calculate price sensitivity", executor: "CODE" },
  { id: "log-4", timestamp: "10:14:13", message: "Compare competitor offers", executor: "TOOL" },
  { id: "log-5", timestamp: "10:14:18", message: "Synthesize recommendations", executor: "LLM" },
  { id: "log-6", timestamp: "10:14:23", message: "Draft final report", executor: "LLM" },
];

export const MOCK_METRICS: RunMetrics = {
  llm_calls: 2,
  llm_calls_avoided: 14,
  input_tokens: 4200,
  output_tokens: 1900,
  estimated_ai_cost_usd: 0.42,
  estimated_baseline_cost_usd: 3.12,
  estimated_cost_saved_usd: 2.7,
  code_tasks: 1,
  tool_tasks: 3,
  llm_tasks: 2,
};

export const MOCK_PARTIES: SavedParty[] = [
  {
    id: "party-merchant",
    name: "Merchant Insight Party",
    purpose: "Market analysis and pricing recommendations.",
    memberIds: ["maya", "rowan", "selene"],
    estimated_cost_usd: 0.42,
    last_run_status: "COMPLETED",
  },
  {
    id: "party-support",
    name: "Support Guild",
    purpose: "Customer-service intelligence.",
    memberIds: ["rowan", "brann", "odo"],
    estimated_cost_usd: 0.28,
    last_run_status: "COMPLETED",
  },
  {
    id: "party-watchers",
    name: "Market Watchers",
    purpose: "Competitive research.",
    memberIds: ["rowan", "selene", "brann", "odo"],
    estimated_cost_usd: 0.35,
    last_run_status: "RUNNING",
  },
];

export const MOCK_RUN_HISTORY: RunSummary[] = [
  {
    run_id: "run-1042",
    goal: "Recommend three highest-impact improvements for the Moonlit Griffin Inn.",
    team_name: "Merchant Insight Party",
    status: "COMPLETED",
    result: "Prioritize weekend bundles",
    date: "2026-10-24",
    duration_ms: 18000,
    estimated_ai_cost_usd: 0.42,
    llm_calls: 2,
    llm_calls_avoided: 14,
  },
  {
    run_id: "run-1041",
    goal: "Audit support ticket themes for the Silver Stag Lodge.",
    team_name: "Support Guild",
    status: "COMPLETED",
    result: "Faster check-in follow-ups",
    date: "2026-10-22",
    duration_ms: 15400,
    estimated_ai_cost_usd: 0.28,
    llm_calls: 2,
    llm_calls_avoided: 9,
  },
  {
    run_id: "run-1040",
    goal: "Track competitor pricing moves across the valley.",
    team_name: "Market Watchers",
    status: "COMPLETED",
    result: "Two rivals raised weekend rates",
    date: "2026-10-20",
    duration_ms: 12900,
    estimated_ai_cost_usd: 0.31,
    llm_calls: 3,
    llm_calls_avoided: 11,
  },
  {
    run_id: "run-1039",
    goal: "Forecast off-season occupancy for the Ember Fox Tavern.",
    team_name: "Merchant Insight Party",
    status: "FAILED",
    result: "Ledger data unavailable",
    date: "2026-10-18",
    duration_ms: 4200,
    estimated_ai_cost_usd: 0.05,
    llm_calls: 1,
    llm_calls_avoided: 2,
  },
];

export const MOCK_LOG_EVENTS: LogEvent[] = [
  { id: "evt-1", timestamp: "2026-10-24 10:14:00", category: "QUEST", message: "Quest created: Moonlit Griffin Inn improvements", actor: "Quest Master" },
  { id: "evt-2", timestamp: "2026-10-24 10:14:01", category: "PARTY", message: "Party assembled: 5 adventurers ready", actor: "QuestMaster" },
  { id: "evt-3", timestamp: "2026-10-24 10:14:02", category: "TOOL", message: "Scroll Archive used to read guest feedback", actor: "Rowan" },
  { id: "evt-4", timestamp: "2026-10-24 10:14:05", category: "TOOL", message: "Ledger Reader gathered revenue and bookings", actor: "Maya" },
  { id: "evt-5", timestamp: "2026-10-24 10:14:07", category: "SECURITY", message: "Permission checked: Maya may read ledger data — ALLOWED", actor: "Odo" },
  { id: "evt-6", timestamp: "2026-10-24 10:14:09", category: "CODE", message: "Executed price sensitivity calculation locally", actor: "Maya" },
  { id: "evt-7", timestamp: "2026-10-24 10:14:13", category: "TOOL", message: "Compass Queries compared competitor offers", actor: "Rowan" },
  { id: "evt-8", timestamp: "2026-10-24 10:14:16", category: "SECURITY", message: "Permission checked: Selene may read financial summary — ALLOWED", actor: "Odo" },
  { id: "evt-9", timestamp: "2026-10-24 10:14:18", category: "LLM", message: "LLM invoked to synthesize recommendations", actor: "Selene" },
  { id: "evt-10", timestamp: "2026-10-24 10:14:23", category: "LLM", message: "LLM invoked to draft final report", actor: "Odo" },
  { id: "evt-11", timestamp: "2026-10-24 10:14:24", category: "PARTY", message: "Adventurer completed task: Draft final report", actor: "Odo" },
  { id: "evt-12", timestamp: "2026-10-24 10:14:25", category: "QUEST", message: "Quest completed: reward revealed with 92% confidence", actor: "QuestMaster" },
];

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: "llm", label: "AI Model Provider", status: "AWAITING_BACKEND" },
  { id: "nessie", label: "Capital One Nessie", status: "AWAITING_BACKEND" },
  { id: "vultr", label: "Vultr", status: "AWAITING_DEPLOYMENT" },
];
