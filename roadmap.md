# QuestMaster roadmap

## Done
- Compact sidebar without a visible scrollbar; uploaded QuestMaster favicon
- Fantasy / Professional / Toyota interface styles with switcher (sidebar + Settings)
- Multicultural themed portraits for all agents in every style
- Custom agents (Amara, Kenji) with distinct names and portraits
- HMR-stable theme context
- QA/polish pass (2026-10-25): .env removed from repo + gitignored (.env.example added);
  demo auth stores salted SHA-256 hashes instead of plaintext; theme switching is
  presentation-only (quest text/team/run preserved); themed terminology across toasts,
  reports, logs, sidebar, teams; auth screens + toaster follow the active theme;
  responsive fixes (1-col agent grid on phones, full-width controls, mobile dialog sheet,
  two-row log items, reports swipe hint, 2+1 cost cards, truncated mobile brand,
  bigger theme-switcher targets); metrics computed from run.metrics (no hardcoded values);
  Toyota sends its themed roles/skills to the backend; chained-timeout polling with
  terminal-state messaging; removed fake "View Details" control; mock/live labels follow
  VITE_USE_MOCK_API; neutral page titles

- Final QA pass (2026-10-25): Toyota mock recommendation respects the selected customer
  (stable → Buy, stressed → Return); Professional/Toyota agent presentation overlays
  (roles, tools, least-privilege scopes) applied only to untouched agents — user edits
  mark the agent customized and win; sample goal follows the theme only while untouched;
  mock Teams/Reports/Logs text adapted per theme via adaptMockText; themed toasts,
  email placeholders and profile titles; "Task Execution Mix" label; Open Team navigates
  to /create; SaaS Ready pill outside Fantasy; legacy plaintext demo accounts purged
  from storage on read; neutral 404 CTA

## Backend integration (per uploaded instructions + API_SPEC)
- [x] createRun sends full payload: goal + team + context.customer_id + quality_mode
- [x] POST /api/runs returns only { run_id, status: "PLANNING" } — recommendation arrives via polling GET /api/runs/{run_id} (normalizeRun maps recommendation → reward, audit_events → log)
- [x] planTeam normalizes backend agents: portrait from local PORTRAITS, description from purpose
- [x] Demo customers: GET /api/demo/customers + customer selector in Quest Forge
- [x] createDemoSession stays client-side (backend has no /demo-session)
- [x] VITE_API_BASE_URL=https://questmaster.tech/api (never raw IP:8000 — Caddy exposes only HTTPS)
- [x] Live mode is the default and local .env (gitignored) uses the live API.

## Open
- [x] Connect Create attachments to live multipart upload/delete; forward IDs to planning and runs; preserve design and avoid team-save endpoints. Nine attachment tests and 30 related tests pass.
- [ ] Verify successful live upload → plan → run → delete after the deployed POST https://questmaster.tech/api/attachments stops returning 404. Current real-browser upload failure is visible and no mock replacement is used.
- [x] Final production integration pass: separate Toyota entry, truthful live activity/reports/integration states, complete recommendation details, hidden mock sidebar teams and README. Live Sarah→Buy / Jordan→Return verified in browser; mock/live API tests pass (45 tests); automatic build/typecheck OK. Full lint has existing formatting debt; changed-file semantic lint passes.
- [ ] Backend must expose GET /api/audit-events?limit=200 (currently 404) and add result/date/llm_calls_avoided to GET /api/runs. Frontend shows unavailable values and truthful errors until supplied.
- [x] Live API polish: identity-stable themed jpg portraits for unfamiliar agents; removed Add Files and misleading backend stubs; HTTP 503 messages and fallback plans rejected; live lunar-beekeeping team verified in all styles, 22 tests passed.
- [x] Generate from the active interface goal and keep generated configurations identical across styles.
- [x] Prepare external saved-team CRUD, reopening by teamId, editing and explicit Save Team; no mock fallback in live mode.
- [x] Supply backend implementation prompts in docs/QuestMaster_TEAM_BACKEND_PROMPTS.md; verify interface switching and session mock CRUD.
- [ ] External backend must implement database team CRUD and atomic save-on-plan; live GET /api/teams returns 404. Backend owner must supply a real scoped session contract before authenticated persistence can be verified.
- Verify hosted frontend origins in backend CORS_ORIGINS (localhost live flow now succeeds; hosted origins were not rechecked in this pass):
  - https://hacktx-2026-spark.lovable.app (published/primary)
  - https://id-preview--1822652e-47c8-4da8-ba55-6c900a2db286.lovable.app (preview)
  - (optional, local dev) http://localhost:8080
