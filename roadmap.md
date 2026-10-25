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
- [x] Live mode is the default; local .env (gitignored) enables mock mode for the preview

## Open
- [x] Generate from the active interface goal and keep generated configurations identical across styles.
- [x] Prepare external saved-team CRUD, reopening by teamId, editing and explicit Save Team; no mock fallback in live mode.
- [x] Supply backend implementation prompts in docs/QuestMaster_TEAM_BACKEND_PROMPTS.md; verify interface switching and session mock CRUD.
- [ ] External backend must implement database team CRUD and atomic save-on-plan; live GET /api/teams returns 404. Backend owner must supply a real scoped session contract before authenticated persistence can be verified.
- Eliška must add the frontend origins to the backend's CORS_ORIGINS — server currently allows only https://questmaster.tech; browser calls from Lovable are blocked:
  - https://hacktx-2026-spark.lovable.app (published/primary)
  - https://id-preview--1822652e-47c8-4da8-ba55-6c900a2db286.lovable.app (preview)
  - (optional, local dev) http://localhost:8080
