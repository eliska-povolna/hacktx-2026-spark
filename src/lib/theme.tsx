// QuestMaster interface-style system (presentation only).
// Three switchable themes: fantasy (existing design), professional, toyota.
// The selected theme is stored in localStorage and applied as a
// `data-theme` attribute on <html>; all visual adaptation happens through
// CSS variables in src/styles.css. Copy differences live in THEME_COPY below.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

export type AppTheme = "fantasy" | "professional" | "toyota";

const THEME_KEY = "questmaster.theme";

export function readTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "professional" || raw === "toyota" ? raw : "fantasy";
  } catch {
    return "fantasy";
  }
}

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("fantasy");

  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  const setTheme = useCallback((next: AppTheme) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable — theme still applies for this session
    }
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// ---- Terminology / label map ----

export interface ThemeCopy {
  brandName: string;
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
  cost: string;
  log: string;
  ready: string;
  toolsTitle: string;
  sampleQuest: string;
  contextChips: string[];
  brandTagline: string;
  quote: string;
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

export const THEME_COPY: Record<AppTheme, ThemeCopy> = {
  fantasy: {
    brandName: "QuestMaster",
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
    cost: "Mana & Cost",
    log: "Quest Log",
    ready: "Ready",
    toolsTitle: "Tools & Artifacts",
    sampleQuest:
      "Study the recent guest feedback for the Moonlit Griffin Inn and recommend the three highest-impact improvements for service, pricing, and repeat visits.",
    contextChips: ["Guest Feedback", "Ledger Data", "Competitor Notes", "Guild Policies"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
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
    cost: "Cost & Efficiency",
    log: "Execution Log",
    ready: "Ready",
    toolsTitle: "Tools",
    sampleQuest:
      "Analyze recent customer feedback and recommend the three highest-impact improvements for service, pricing, and customer retention.",
    contextChips: ["Customer Feedback", "Financial Data", "Competitor Notes", "Policies"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
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
    cost: "Efficiency",
    log: "Decision Trace",
    ready: "Ready",
    toolsTitle: "Tools",
    sampleQuest:
      "Determine the smartest next mobility decision for this customer using vehicle, contract, usage, and financial context.",
    contextChips: ["Customer Profile", "Vehicle Data", "Contract", "Usage", "Financial Context"],
    brandTagline: "The best agent platform\nknows when not to use an agent.",
    quote: "“Good questions lead to greater journeys.”",
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

// ---- Toyota demo content (presentation-only mock overlay) ----

const TOYOTA_ROLES: Record<string, { role: string; skills: string[] }> = {
  maya: { role: "Financial Context Analyst", skills: ["Affordability", "Cash Flow", "Forecasting", "Risk Assessment"] },
  rowan: { role: "Customer Context Analyst", skills: ["Usage Analysis", "Data Gathering", "Research", "Summarize"] },
  brann: { role: "Vehicle & Mobility Analyst", skills: ["Vehicle Fit", "Usage Analysis", "Optimization", "Pattern Recognition"] },
  selene: { role: "Decision Specialist", skills: ["Trade-offs", "Recommendation", "Modeling", "Strategy"] },
  odo: { role: "Policy & Quality Reviewer", skills: ["Policy", "Validation", "Safety", "Quality"] },
};

export const TOYOTA_AGENTS: AgentDefinition[] = MOCK_AGENTS.map((agent) => {
  const override = TOYOTA_ROLES[agent.id];
  return override ? { ...agent, role: override.role, skills: override.skills } : agent;
});

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

export function getAgentsForTheme(theme: AppTheme, agents: AgentDefinition[]): AgentDefinition[] {
  return theme === "toyota" ? TOYOTA_AGENTS : agents;
}

// ---- Theme-specific agent portraits ----

const PRO_PORTRAITS: Record<string, string> = {
  maya: proMaya,
  rowan: proRowan,
  brann: proBrann,
  selene: proSelene,
  odo: proOdo,
};

const TOYOTA_PORTRAITS: Record<string, string> = {
  maya: toyotaMaya,
  rowan: toyotaRowan,
  brann: toyotaBrann,
  selene: toyotaSelene,
  odo: toyotaOdo,
};

export function getPortrait(theme: AppTheme, agentId: string): string {
  if (theme === "professional") return PRO_PORTRAITS[agentId] ?? PORTRAITS[agentId] ?? "";
  if (theme === "toyota") return TOYOTA_PORTRAITS[agentId] ?? PORTRAITS[agentId] ?? "";
  return PORTRAITS[agentId] ?? "";
}
