// QuestMaster frontend API types — mirror docs/QuestMaster_API_SPEC.md.
// When the real backend lands, these shapes should not change.

export type ExecutorType = "CODE" | "TOOL" | "LLM";

export type RunStatus =
  | "PLANNING"
  | "RUNNING"
  | "REVIEWING"
  | "COMPLETED"
  | "FAILED"
  | "BUDGET_LIMIT"
  | "APPROVAL_REQUIRED";

export type TaskStatus =
  | "WAITING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export interface BudgetPolicy {
  max_llm_cost_usd: number;
  max_llm_calls: number;
}

export interface AgentPermissions {
  data_scopes: string[];
  actions: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  purpose: string;
  description: string;
  skills: string[];
  instructions: string;
  allowed_tools: string[];
  permissions: AgentPermissions;
  guardrails: string[];
  model_policy: string;
  budget: BudgetPolicy;
  estimated_cost_usd: number;
  portrait: string;
}

export interface TeamDefinition {
  id: string;
  team_name: string;
  summary: string;
  agents: AgentDefinition[];
}

export interface PlanTeamResponse {
  team: TeamDefinition;
  planner_source: "LLM" | "FALLBACK";
  fallback_used: boolean;
}

export interface TaskDefinition {
  id: string;
  name: string;
  assigned_agent_id: string;
  executor: ExecutorType;
  action: string;
  depends_on: string[];
  risk_level: "low" | "medium" | "high";
}

export interface RunTask extends TaskDefinition {
  status: TaskStatus;
  activity_summary: string;
  tool: string | null;
  duration_ms: number | null;
  cost_usd: number;
  data_source: string;
}

export interface RunMetrics {
  llm_calls: number;
  llm_calls_avoided: number;
  input_tokens: number;
  output_tokens: number;
  estimated_ai_cost_usd: number;
  estimated_baseline_cost_usd: number;
  estimated_cost_saved_usd: number;
  code_tasks: number;
  tool_tasks: number;
  llm_tasks: number;
}

export interface QuestReward {
  id: string;
  title: string;
  confidence: number;
  summary: string;
  reasons: string[];
}

export interface QuestLogEntry {
  id: string;
  timestamp: string;
  message: string;
  executor: ExecutorType;
}

export interface Run {
  run_id: string;
  status: RunStatus;
  goal: string;
  created_at: string;
  updated_at: string;
  tasks: RunTask[];
  metrics: RunMetrics;
  reward: QuestReward | null;
  log: QuestLogEntry[];
}

export interface DemoCustomer {
  id: string;
  name: string;
  vehicle: string;
  scenario_label: string;
  description: string;
}

export interface CreateRunInput {
  goal: string;
  team: TeamDefinition;
  customerId: string;
}

// ---- Raw backend shapes (docs/QuestMaster_API_SPEC.md §3.9, §3.10, §10) ----
// The backend run response uses `recommendation` + `audit_events`; the client
// normalizes them into the frontend `Run` shape (reward + log).

export interface ToyotaRecommendation {
  recommended_action: string;
  confidence: number;
  headline: string;
  summary: string;
  reasons: string[];
  assumptions?: string[];
  next_step?: { label: string; action_type: string };
  options?: unknown[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  run_id?: string;
  agent_id?: string;
  event_type?: string;
  executor_type?: ExecutorType;
  resource?: string;
  result?: string;
  message: string;
  cost_usd?: number;
}

export interface BackendRun {
  run_id: string;
  status: RunStatus;
  goal: string;
  created_at: string;
  updated_at: string;
  tasks?: Partial<RunTask>[];
  metrics?: Partial<RunMetrics>;
  recommendation?: ToyotaRecommendation | null;
  audit_events?: AuditEvent[];
  financial_context?: unknown;
  outputs?: unknown[];
  evaluators?: unknown[];
}

export interface RunSummary {
  run_id: string;
  goal: string;
  team_name: string;
  status: RunStatus;
  result: string;
  date: string;
  duration_ms: number;
  estimated_ai_cost_usd: number;
  llm_calls: number;
  llm_calls_avoided: number;
}

export interface Integration {
  id: string;
  label: string;
  status: "CONNECTED" | "HOSTED" | "AWAITING_BACKEND" | "AWAITING_DEPLOYMENT";
}

export interface DemoSession {
  user: {
    id: string;
    name: string;
    organization: string;
    role: string;
  };
  workspace_id: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  category: "QUEST" | "PARTY" | "CODE" | "TOOL" | "LLM" | "SECURITY";
  message: string;
  actor: string;
}

export interface SavedParty {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
  estimated_cost_usd: number;
  last_run_status: "COMPLETED" | "FAILED" | "RUNNING" | "NEVER";
}
