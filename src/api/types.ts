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
  | "APPROVAL_REQUIRED"
  | "NO_ACTION_NEEDED";

export type WorkStyle = "fast" | "balanced" | "thorough";
export type ModelPolicy = "auto" | "deterministic_only" | "llm_allowed";

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
  /** Named integration grants only (e.g. nessie, meta). Secrets stay server-side. */
  allowed_integrations?: string[];
  /** Set when the user explicitly edited this agent — theme overlays then
   *  leave their role/skills/tools/scopes untouched (portrait still swaps). */
  customized?: boolean;
}

export interface TeamPolicy {
  max_llm_calls: number;
  max_llm_cost_usd: number;
  work_style: WorkStyle;
  guardrails: string[];
}

export interface TeamDefinition {
  id: string;
  team_name: string;
  summary: string;
  agents: AgentDefinition[];
  policy?: TeamPolicy;
}

export interface ContextSource {
  id: string;
  type: string;
  label: string;
  status: string;
  dismissible: boolean;
  description: string;
  executor_hint?: string | null;
  attachment_id?: string | null;
}

export interface PlanTeamResponse {
  team: TeamDefinition;
  planner_source: "LLM" | "FALLBACK";
  fallback_used: boolean;
  saved_team?: SavedTeam;
}

export type PlanningInterface = "fantasy" | "professional" | "toyota";

export interface SavedTeam extends TeamDefinition {
  goal: string;
}

export interface SaveTeamInput {
  team: TeamDefinition;
  goal: string;
}

export interface SavedTeamSummary {
  id: string;
  name: string;
  purpose: string;
  member_ids: string[];
  estimated_cost_usd: number;
  last_run_status: SavedParty["last_run_status"];
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
  work_style?: string;
  last_model_tier?: string | null;
  model_tiers_used?: string[];
  routing_decisions?: number;
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
  recommendation?: ToyotaRecommendation | null;
  financial_context?: FinancialContext | null;
  evaluators?: EvaluatorResult[];
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
  attachment_ids?: string[];
  context_source_ids?: string[];
  quality_mode?: "normal" | "strict";
}

export interface MobilityTriggerResponse {
  customer_id: string;
  relevant: boolean;
  reasons: string[];
  run_id?: string | null;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  has_text_excerpt: boolean;
}

// ---- Raw backend shapes (docs/QuestMaster_API_SPEC.md §3.9, §3.10, §10) ----
// The backend run response uses `recommendation` + `audit_events`; the client
// normalizes them into the frontend `Run` shape (reward + log).

export interface RecommendationOption {
  id?: string;
  label: string;
  monthly_cost?: number | null;
  three_year_cost?: number | null;
  fit_score?: number | null;
  safe_for_budget?: boolean | null;
  tradeoffs?: string[];
}

export interface FinancialContext {
  financial_stress?: string;
  safe_mobility_budget?: number | null;
  emergency_runway_months?: number | null;
  monthly_free_cashflow?: number | null;
  cash_reserve?: number | null;
}

export interface EvaluatorResult {
  label?: string;
  name?: string;
  evaluator?: string;
  evaluator_id?: string;
  status: string;
  message?: string;
  details?: string;
}

export interface ToyotaRecommendation {
  recommended_action: string;
  confidence: number;
  headline: string;
  summary: string;
  reasons: string[];
  assumptions?: string[];
  next_step?: { label: string; action_type: string };
  options?: RecommendationOption[];
  financial_context?: FinancialContext | null;
  evaluators?: EvaluatorResult[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  run_id?: string;
  agent_id?: string;
  agent_name?: string;
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
  financial_context?: FinancialContext | null;
  outputs?: unknown[];
  evaluators?: EvaluatorResult[];
}

export interface RunSummary {
  run_id: string;
  goal: string;
  team_name: string;
  status: RunStatus;
  result: string;
  date: string;
  duration_ms: number | null;
  estimated_ai_cost_usd: number | null;
  llm_calls: number | null;
  llm_calls_avoided: number | null;
}

export interface Integration {
  id: string;
  label: string;
  status: "CONNECTED" | "HOSTED" | "UNCONFIGURED" | "ERROR" | "AWAITING_BACKEND" | "AWAITING_DEPLOYMENT";
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
  event_type?: string;
  run_id?: string;
}

export interface SavedParty {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
  estimated_cost_usd: number;
  last_run_status: "COMPLETED" | "FAILED" | "RUNNING" | "NEVER";
}
