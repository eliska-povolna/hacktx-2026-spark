// QuestMaster interface-style system (presentation only).
// Three switchable themes: fantasy (existing design), professional, toyota.
// The selected theme is stored in localStorage and applied as a
// `data-theme` attribute on <html>; all visual adaptation happens through
// CSS variables in src/styles.css. Copy differences live in THEME_COPY below.

import type { AppTheme } from "./theme-context";
export { ThemeProvider, useTheme, readTheme, type AppTheme } from "./theme-context";

import { MOCK_AGENTS, PORTRAITS } from "@/api/mockData";
import type { AgentDefinition, QuestReward, RunMetrics } from "@/api/types";

import proBrann from "@/assets/pro-brann.jpg";
import proMaya from "@/assets/pro-maya.jpg";
import proOdo from "@/assets/pro-odo.jpg";
import proRowan from "@/assets/pro-rowan.jpg";
import proSelene from "@/assets/pro-selene.jpg";
import toyotaBrann from "@/assets/toyota-brann.jpg";
import toyotaMaya from "@/assets/toyota-maya.jpg";
import toyotaOdo from "@/assets/toyota-odo.jpg";
import toyotaRowan from "@/assets/toyota-rowan.jpg";
import toyotaSelene from "@/assets/toyota-selene.jpg";
import fantasyAmara from "@/assets/portrait-amara.jpg";
import fantasyKenji from "@/assets/portrait-kenji.jpg";
import proAmara from "@/assets/pro-amara.jpg";
import proKenji from "@/assets/pro-kenji.jpg";
import toyotaAmara from "@/assets/toyota-amara.jpg";
import toyotaKenji from "@/assets/toyota-kenji.jpg";

// ---- Terminology / label map ----

export interface ThemeCopy {
  brandName: string;
  /** Shorter label for the mobile top bar. */
  brandShort: string;
  nav: {
    create: string;
    createSub: string;
    teams: string;
    teamsSub: string;
    reports: string;
    reportsSub: string;
    logs: string;
    logsSub: string;
    settings: string;
    settingsSub: string;
  };
  savedParties: string;
  /** Neutral saved-team examples shown in the sidebar. */
  savedTeamNames: string[];
  goalTitle: string;
  buildButton: string;
  teamTitle: string;
  readySuffix: string;
  addCustom: string;
  configure: string;
  configureTitle: string;
  removeAgent: string;
  outputs: string;
  outputsBadge: string;
  /** Badge shown on the outputs panel when the live backend produced it. */
  outputsBadgeLive: string;
  cost: string;
  log: string;
  ready: string;
  toolsTitle: string;
  sampleQuest: string;
  contextChips: string[];
  brandTagline: string;
  quote: string;
  auth: {
    signInTitle: string;
    signInSub: string;
    signInButton: string;
    signInPending: string;
    demoButton: string;
    signUpTitle: string;
    signUpSub: string;
    signUpButton: string;
    signUpPending: string;
    resetTitle: string;
    resetSub: string;
  };
  toastPlanError: string;
  toastNoGoal: string;
  toastRunError: string;
  toastAgentRemoved: (name: string) => string;
  toastTeamRemoved: (name: string) => string;
  /** Themed profile title shown under the user name (presentation only). */
  userTitle: string;
  emailPlaceholder: string;
  openTeam: string;
  openTeamHint: string;
  reportGoalCol: string;
  reportTeamCol: string;
  logsEmpty: string;
  pages: {
    teamsTitle: string;
    teamsSub: string;
    reportsTitle: string;
    reportsSub: string;
    logsTitle: string;
    logsSub: string;
    settingsTitle: string;
    settingsSub: string;
  };
}

/** Shown on every auth screen — this build uses demo-only browser auth. */
export const DEMO_AUTH_NOTE = "Demo sign-in — accounts are stored only in this browser.";

export const THEME_COPY: Record<AppTheme, ThemeCopy> = {
  fantasy: {
    brandName: "QuestMaster",
    brandShort: "QuestMaster",
    nav: {
      create: "Quest Forge",
      createSub: "Create new quests",
      teams: "Adventuring Parties",
      teamsSub: "Manage your teams",
      reports: "Chronicles",
      reportsSub: "Reports & insights",
      logs: "Quest Log",
      logsSub: "Activity & execution logs",
      settings: "Sanctum",
      settingsSub: "Settings & integrations",
    },
    savedParties: "Saved Parties",
    savedTeamNames: ["Merchant Insight Party", "Support Guild", "Market Watchers"],
    goalTitle: "What quest do you seek?",
    buildButton: "Assemble My Party",
    teamTitle: "Meet Your Adventurers",
    readySuffix: "adventurers • Ready for your quest",
    addCustom: "Add Custom Adventurer",
    configure: "Configure Adventurer",
    configureTitle: "Configure Adventurer",
    removeAgent: "Remove adventurer",
    outputs: "Quest Rewards",
    outputsBadge: "Mock Output",
    outputsBadgeLive: "Live Result",
    cost: "Mana & Cost",
    log: "Quest Log",
    ready: "Ready",
    toolsTitle: "Tools & Artifacts",
    sampleQuest:
      "Study the recent guest feedback for the Moonlit Griffin Inn and recommend the three highest-impact improvements for service, pricing, and repeat visits.",
    contextChips: ["Guest Feedback", "Ledger Data", "Competitor Notes", "Guild Policies"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
    auth: {
      signInTitle: "Welcome back, Quest Master",
      signInSub: "Your party awaits.",
      signInButton: "Enter the Guild",
      signInPending: "Opening the gates...",
      demoButton: "Enter as a Traveling Guest",
      signUpTitle: "Create Your Chronicle",
      signUpSub: "Every legend begins with a first page.",
      signUpButton: "Create Your Chronicle",
      signUpPending: "Inscribing your name...",
      resetTitle: "Recover Your Seal",
      resetSub: "Set a new password for your guild account.",
    },
    toastPlanError: "The guild archives could not be reached.",
    toastNoGoal: "Describe your quest first.",
    toastRunError: "The quest could not be started.",
    userTitle: "Quest Master",
    emailPlaceholder: "you@guild.example",
    toastAgentRemoved: (name) => `${name} has been dismissed from the party.`,
    toastTeamRemoved: (name) => `${name} disbanded.`,
    openTeam: "Open Party",
    openTeamHint: "Open this saved party in the Quest Forge.",
    reportGoalCol: "Quest",
    reportTeamCol: "Party",
    logsEmpty: "No entries in this chapter yet.",
    pages: {
      teamsTitle: "Adventuring Parties",
      teamsSub: "Your saved bands of adventurers, ready for the next quest.",
      reportsTitle: "Chronicles",
      reportsSub: "Reports & insights from your completed quests.",
      logsTitle: "Quest Log",
      logsSub: "Every step your parties have taken, recorded for the chronicles.",
      settingsTitle: "Sanctum",
      settingsSub: "Settings & integrations.",
    },
  },
  professional: {
    brandName: "QuestMaster",
    brandShort: "QuestMaster",
    nav: {
      create: "Create",
      createSub: "Start a new analysis",
      teams: "Teams",
      teamsSub: "Manage your teams",
      reports: "Reports",
      reportsSub: "Reports & insights",
      logs: "Activity Log",
      logsSub: "Execution history",
      settings: "Settings",
      settingsSub: "Settings & integrations",
    },
    savedParties: "Saved Teams",
    savedTeamNames: ["Customer Insight Team", "Support Ops Team", "Market Watchers"],
    goalTitle: "What do you want to accomplish?",
    buildButton: "Build My Team",
    teamTitle: "Your AI Team",
    readySuffix: "agents • Ready",
    addCustom: "Add Custom Agent",
    configure: "Configure Agent",
    configureTitle: "Configure Agent",
    removeAgent: "Remove agent",
    outputs: "Outputs",
    outputsBadge: "Mock Output",
    outputsBadgeLive: "Live Result",
    cost: "Cost & Efficiency",
    log: "Execution Log",
    ready: "Ready",
    toolsTitle: "Tools",
    sampleQuest:
      "Analyze recent customer feedback and recommend the three highest-impact improvements for service, pricing, and customer retention.",
    contextChips: ["Customer Feedback", "Financial Data", "Competitor Notes", "Policies"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
    auth: {
      signInTitle: "Welcome back",
      signInSub: "Sign in to your workspace.",
      signInButton: "Sign In",
      signInPending: "Signing in...",
      demoButton: "Continue with Demo",
      signUpTitle: "Create your account",
      signUpSub: "Start building your AI team.",
      signUpButton: "Create Account",
      signUpPending: "Creating account...",
      resetTitle: "Reset password",
      resetSub: "Set a new password for your account.",
    },
    toastPlanError: "The planning service could not be reached.",
    toastNoGoal: "Describe your goal first.",
    toastRunError: "The run could not be started.",
    userTitle: "Team Owner",
    emailPlaceholder: "you@company.com",
    toastAgentRemoved: (name) => `${name} has been removed from the team.`,
    toastTeamRemoved: (name) => `${name} deleted.`,
    openTeam: "Open Team",
    openTeamHint: "Open this saved team in the editor.",
    reportGoalCol: "Goal",
    reportTeamCol: "Team",
    logsEmpty: "No activity yet.",
    pages: {
      teamsTitle: "Teams",
      teamsSub: "Your saved agent teams, ready for the next task.",
      reportsTitle: "Reports",
      reportsSub: "Reports & insights from your completed runs.",
      logsTitle: "Activity Log",
      logsSub: "Every step your teams have taken, recorded for review.",
      settingsTitle: "Settings",
      settingsSub: "Settings & integrations.",
    },
  },
  toyota: {
    brandName: "Toyota Mobility Studio",
    brandShort: "Mobility Studio",
    nav: {
      create: "Mobility Studio",
      createSub: "Start a new decision",
      teams: "Agent Teams",
      teamsSub: "Manage your teams",
      reports: "Insights",
      reportsSub: "Reports & insights",
      logs: "Activity",
      logsSub: "Decision history",
      settings: "Settings",
      settingsSub: "Settings & integrations",
    },
    savedParties: "Saved Teams",
    savedTeamNames: ["Mobility Decision Team", "Customer Support Team", "Market Analysis Team"],
    goalTitle: "What decision can we help with?",
    buildButton: "Build Decision Team",
    teamTitle: "Your Decision Team",
    readySuffix: "specialists • Ready",
    addCustom: "Add Custom Specialist",
    configure: "Configure Specialist",
    configureTitle: "Configure Specialist",
    removeAgent: "Remove specialist",
    outputs: "Recommendation",
    outputsBadge: "Demo Recommendation",
    outputsBadgeLive: "Live Recommendation",
    cost: "Efficiency",
    log: "Decision Trace",
    ready: "Ready",
    toolsTitle: "Tools",
    sampleQuest:
      "Determine the smartest next mobility decision for this customer using vehicle, contract, usage, and financial context.",
    contextChips: ["Customer Profile", "Vehicle Data", "Contract", "Usage", "Financial Context"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
    auth: {
      signInTitle: "Welcome back",
      signInSub: "Sign in to Toyota Mobility Studio.",
      signInButton: "Sign In",
      signInPending: "Signing in...",
      demoButton: "Continue with Demo",
      signUpTitle: "Create your account",
      signUpSub: "Set up your decision workspace.",
      signUpButton: "Create Account",
      signUpPending: "Creating account...",
      resetTitle: "Reset password",
      resetSub: "Set a new password for your account.",
    },
    toastPlanError: "The planning service could not be reached.",
    toastNoGoal: "Describe the decision you need first.",
    toastRunError: "The decision run could not be started.",
    userTitle: "Decision Workspace Owner",
    emailPlaceholder: "you@toyota.example",
    toastAgentRemoved: (name) => `${name} has been removed from the decision team.`,
    toastTeamRemoved: (name) => `${name} deleted.`,
    openTeam: "Open Team",
    openTeamHint: "Open this saved team in the studio.",
    reportGoalCol: "Decision",
    reportTeamCol: "Decision Team",
    logsEmpty: "No activity yet.",
    pages: {
      teamsTitle: "Agent Teams",
      teamsSub: "Your saved specialist teams, ready for the next decision.",
      reportsTitle: "Insights",
      reportsSub: "Reports & insights from your completed decisions.",
      logsTitle: "Activity",
      logsSub: "Every step your teams have taken, recorded for review.",
      settingsTitle: "Settings",
      settingsSub: "Settings & integrations.",
    },
  },
};

export const THEME_OPTIONS: { value: AppTheme; label: string }[] = [
  { value: "fantasy", label: "🛡 Fantasy" },
  { value: "professional", label: "◼ Professional" },
  { value: "toyota", label: "● Toyota" },
];

// ---- Theme presentation overlays for agents (presentation only) ----
// Same underlying agent IDs and architecture — only the displayed role,
// skills, tools and data scopes change. Applied in getAgentsForTheme and
// skipped for agents the user explicitly customized.

interface ThemeAgentPresentation {
  role?: string;
  skills?: string[];
  tools?: string[];
  scopes?: string[];
}

const PRO_PRESENTATION: Record<string, ThemeAgentPresentation> = {
  maya: {
    tools: ["Financial Data Reader", "Document Search", "Trend Analysis", "Cost Calculator", "Report Builder"],
    scopes: ["customer_feedback", "financial_data", "competitor_notes", "policies"],
  },
  rowan: {
    role: "Research Analyst",
    tools: ["Web Search", "Document Search", "External Research"],
    scopes: ["customer_feedback", "competitor_notes"],
  },
  brann: {
    tools: ["Process Mapper", "Cost Calculator", "Pattern Lens"],
    scopes: ["financial_data", "policies"],
  },
  selene: {
    role: "Decision Analyst",
    tools: ["Decision Model", "Trend Analysis", "Report Builder"],
    scopes: ["financial_summary", "competitor_notes"],
  },
  odo: {
    tools: ["Policy Reference", "Validation Checks"],
    scopes: ["policies", "financial_summary"],
  },
};

// Toyota specialists: realistic tools and least-privilege data scopes.
// Downstream agents see derived context only — never raw financial
// transactions (Decision Specialist gets financial_context summaries,
// the Reviewer gets derived_financial_context).
const TOYOTA_PRESENTATION: Record<string, ThemeAgentPresentation> = {
  maya: {
    role: "Financial Context Analyst",
    skills: ["Affordability", "Cash Flow", "Forecasting", "Risk Assessment"],
    tools: ["Capital One Nessie", "Financial Calculator", "Financial Context Builder"],
    scopes: ["financial_context", "approved_financial_data"],
  },
  rowan: {
    role: "Customer Context Analyst",
    skills: ["Usage Analysis", "Data Gathering", "Research", "Summarize"],
    tools: ["Customer Profile", "Usage Data"],
    scopes: ["customer_profile", "usage_data"],
  },
  brann: {
    role: "Vehicle & Mobility Analyst",
    skills: ["Vehicle Fit", "Usage Analysis", "Optimization", "Pattern Recognition"],
    tools: ["Toyota Vehicle Data", "Contract Data"],
    scopes: ["vehicle_data", "contract_data", "usage_data"],
  },
  selene: {
    role: "Decision Specialist",
    skills: ["Trade-offs", "Recommendation", "Modeling", "Strategy"],
    tools: ["Decision Model", "Recommendation Builder"],
    scopes: ["financial_context", "vehicle_summary", "customer_context"],
  },
  odo: {
    role: "Policy & Quality Reviewer",
    skills: ["Policy", "Validation", "Safety", "Quality"],
    tools: ["Policy Validator", "Safety Checks"],
    scopes: ["policy_data", "derived_financial_context"],
  },
};

const TOYOTA_ROLES: Record<string, { role: string; skills: string[] }> = Object.fromEntries(
  Object.entries(TOYOTA_PRESENTATION).map(([id, p]) => [id, { role: p.role ?? "", skills: p.skills ?? [] }]),
);

export const TOYOTA_AGENTS: AgentDefinition[] = MOCK_AGENTS.map((agent) => {
  const override = TOYOTA_ROLES[agent.id];
  return override ? { ...agent, role: override.role, skills: override.skills } : agent;
});

// Theme-specific portrait sets (defined before getAgentsForTheme uses them).
const PRO_PORTRAITS: Record<string, string> = {
  amara: proAmara,
  kenji: proKenji,
  maya: proMaya,
  rowan: proRowan,
  brann: proBrann,
  selene: proSelene,
  odo: proOdo,
};

const TOYOTA_PORTRAITS: Record<string, string> = {
  amara: toyotaAmara,
  kenji: toyotaKenji,
  maya: toyotaMaya,
  rowan: toyotaRowan,
  brann: toyotaBrann,
  selene: toyotaSelene,
  odo: toyotaOdo,
};

const PORTRAIT_KEYS = ["maya", "rowan", "brann", "selene", "odo", "amara", "kenji"];

export function getThemePortraitByIndex(theme: AppTheme, index: number): string {
  const key = PORTRAIT_KEYS[index % PORTRAIT_KEYS.length] ?? "maya";
  return getPortrait(theme, key);
}

// ---- Function-based identity assignment (live-planned agents) ----
// Live LLM agents arrive with backend names but no portraits. Instead of a
// random hash, classify each agent by its function (role/skills/purpose/
// scopes) and give it the matching canonical identity: Maya = finance,
// Rowan = research, Brann = operations/analysis, Selene = decision/strategy,
// Odo = review/policy. The same function always gets the same portrait in
// every theme. Agents whose function does not match keep identity hashing.

type AgentFunctionKey = "maya" | "rowan" | "brann" | "selene" | "odo";

const FUNCTION_KEYWORDS: [RegExp, AgentFunctionKey][] = [
  [/financ|budget|cost|ledger|account|billing|cash.?flow|affordab/i, "maya"],
  [/research|gather|web.?search|explor|survey|discover/i, "rowan"],
  [/analy|optimi|process|pattern|operation|metric|vehicle|usage|data(?!\s*privacy)/i, "brann"],
  [/decision|recommend|strateg|synthes|model|priorit/i, "selene"],
  [/review|polic|valid|guard|complian|secur|quality|safety|audit|risk|ethic/i, "odo"],
];

export function classifyAgentFunction(agent: {
  role?: string;
  skills?: string[];
  purpose?: string;
  description?: string;
  permissions?: { data_scopes?: string[] };
}): AgentFunctionKey | null {
  const text = [agent.role, agent.purpose, agent.description,
    ...(agent.skills ?? []), ...(agent.permissions?.data_scopes ?? [])]
    .filter(Boolean).join(" ");
  for (const [pattern, key] of FUNCTION_KEYWORDS) {
    if (pattern.test(text)) return key;
  }
  return null;
}

// Assign canonical portraits by function. When several agents share one
// function, the first keeps the canonical identity and the rest fall back
// to unused pool entries so portraits stay distinct within a team.
export function getFunctionPortrait(
  theme: AppTheme,
  agent: Parameters<typeof classifyAgentFunction>[0] & { id: string; name: string },
  usedKeys: Set<string>,
): string {
  const key = classifyAgentFunction(agent);
  if (key && !usedKeys.has(key)) {
    usedKeys.add(key);
    return getPortrait(theme, key);
  }
  const fallback = getPortrait(theme, agent.id, agent.name);
  const fallbackKey = PORTRAIT_KEYS.find((k) => getPortrait(theme, k) === fallback);
  if (fallbackKey && !usedKeys.has(fallbackKey)) {
    usedKeys.add(fallbackKey);
    return fallback;
  }
  const free = PORTRAIT_KEYS.find((k) => !usedKeys.has(k));
  if (free) {
    usedKeys.add(free);
    return getPortrait(theme, free);
  }
  return fallback;
}

export function getPortrait(theme: AppTheme, agentId: string, agentName = ""): string {
  const id = agentId.toLowerCase();
  const key = id.startsWith("custom-amara-") ? "amara"
    : id.startsWith("custom-kenji-") ? "kenji" : id;
  const pool = theme === "professional" ? PRO_PORTRAITS : theme === "toyota" ? TOYOTA_PORTRAITS
    : { ...PORTRAITS, amara: fantasyAmara, kenji: fantasyKenji };
  const matched = pool[key] || pool[agentName.toLowerCase()];
  if (matched) return matched;
  // Identity-based selection is stable across reordering and theme changes.
  let hash = 0;
  for (const character of id || agentName.toLowerCase()) {
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  }
  return pool[PORTRAIT_KEYS[hash % PORTRAIT_KEYS.length] ?? "maya"] || fantasyAmara;
}

// Canonical configuration is independent of the currently displayed theme.
export function createCustomAgent(agents: AgentDefinition[]): AgentDefinition {
  const choices = [{ key: "amara", name: "Amara" }, { key: "kenji", name: "Kenji" }];
  const choice = choices.find(({ key }) => !agents.some((agent) => agent.id.startsWith(`custom-${key}-`)))
    ?? choices[agents.filter((agent) => agent.id.startsWith("custom-")).length % choices.length]
    ?? { key: "amara", name: "Amara" };
  let name = choice.name;
  let suffix = 2;
  while (agents.some((agent) => agent.name === name)) name = `${choice.name} ${suffix++}`;
  const id = `custom-${choice.key}-${crypto.randomUUID()}`;
  return {
    id, name, portrait: getPortrait("fantasy", id),
    role: "Custom Specialist",
    purpose: "A custom agent shaped by your goal.",
    description: "A custom agent. Configure their role, skills, and guardrails.",
    skills: ["Custom"], instructions: "", allowed_tools: ["Scroll Archive"],
    permissions: { data_scopes: ["guest_feedback"], actions: ["read"] },
    guardrails: ["Stay within budget limits"],
    model_policy: "Use LLM for reasoning. Prefer tools and code first.",
    budget: { max_llm_cost_usd: 0.5, max_llm_calls: 2 }, estimated_cost_usd: 0.05,
  };
}

export const TOYOTA_REWARD: QuestReward = {
  id: "out-toyota-001",
  title: "Recommended Next Move: Buy Current Vehicle",
  confidence: 0.92,
  summary:
    "Based on the customer's vehicle, contract, usage, and financial context, buying out the current vehicle is the smartest next mobility decision.",
  reasons: [
    "Fits the customer's safe mobility budget",
    "Current vehicle still matches expected usage",
    "Lower estimated three-year cost than upgrading",
    "Preserves flexibility without unnecessary monthly expense",
  ],
};

export const TOYOTA_METRICS: RunMetrics = {
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

export function getSampleAgentsForTheme(theme: AppTheme, agents: AgentDefinition[]): AgentDefinition[] {
  const presentation =
    theme === "toyota" ? TOYOTA_PRESENTATION : theme === "professional" ? PRO_PRESENTATION : undefined;
  return agents.map((agent) => {
    // User-edited agents keep their own role/skills/tools/scopes — theme
    // defaults apply only to untouched agents. Portraits always follow the
    // active theme (they are derived, never edited).
    const override = agent.customized ? undefined : presentation?.[agent.id];
    return {
      ...agent,
      ...(override?.role ? { role: override.role } : undefined),
      ...(override?.skills ? { skills: override.skills } : undefined),
      ...(override?.tools ? { allowed_tools: override.tools } : undefined),
      ...(override?.scopes
        ? { permissions: { ...agent.permissions, data_scopes: override.scopes } }
        : undefined),
      portrait: getPortrait(theme, agent.id) || agent.portrait,
    };
  });
}

// Generated/saved configurations are authoritative; styling never changes them.
// Portraits follow the agent's function (finance → Maya, review → Odo, …) so
// the same kind of agent keeps the same face in every theme; unclassifiable
// agents keep stable identity hashing.
export function getAgentsForTheme(theme: AppTheme, agents: AgentDefinition[]): AgentDefinition[] {
  const usedKeys = new Set<string>();
  return agents.map((agent) => ({
    ...agent,
    portrait: getFunctionPortrait(theme, agent, usedKeys),
  }));
}

// ---- Mock-content text adapter (presentation only) ----
// Teams / Reports / Logs share one mock dataset; these ordered replacement
// pairs re-label the fantasy wording for the non-fantasy themes so each
// interface reads naturally without duplicating the data.

const MOCK_TEXT_ADAPTATIONS: Record<Exclude<AppTheme, "fantasy">, [string, string][]> = {
  professional: [
    ["Merchant Insight Party", "Customer Insight Team"],
    ["Support Guild", "Support Operations Team"],
    ["Market Watchers", "Market Analysis Team"],
    ["Moonlit Griffin Inn", "our flagship customer account"],
    ["Silver Stag Lodge", "the support organization"],
    ["Ember Fox Tavern", "the key account"],
    ["Scroll Archive", "Document Search"],
    ["Compass Queries", "External Research"],
    ["Ledger Reader", "Financial Data Reader"],
    ["guest feedback", "customer feedback"],
    ["Party assembled: 5 adventurers ready", "Team assembled: 5 agents ready"],
    ["Adventurer completed task", "Agent completed task"],
    ["Quest created", "Run created"],
    ["Quest completed: reward revealed", "Run completed: result ready"],
    ["Quest Master", "Team Owner"],
  ],
  toyota: [
    ["Merchant Insight Party", "Mobility Decision Team"],
    ["Support Guild", "Customer Context Team"],
    ["Market Watchers", "Mobility Analysis Team"],
    ["Moonlit Griffin Inn", "the selected Toyota customer"],
    ["Silver Stag Lodge", "the customer support program"],
    ["Ember Fox Tavern", "the mobility portfolio"],
    ["Scroll Archive", "Knowledge Base"],
    ["Compass Queries", "External Research"],
    ["Ledger Reader", "Financial Context Builder"],
    ["guest feedback", "customer feedback"],
    ["Party assembled: 5 adventurers ready", "Team assembled: 5 specialists ready"],
    ["Adventurer completed task", "Specialist completed task"],
    ["Quest created", "Decision started"],
    ["Quest completed: reward revealed", "Decision completed: recommendation ready"],
    ["Quest Master", "Workspace Owner"],
  ],
};

export function adaptMockText(theme: AppTheme, text: string): string {
  if (theme === "fantasy") return text;
  let out = text;
  for (const [from, to] of MOCK_TEXT_ADAPTATIONS[theme]) out = out.replaceAll(from, to);
  return out;
}
