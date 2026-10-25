# QuestMaster roadmap

## Done
- Compact sidebar without a visible scrollbar; uploaded QuestMaster favicon
- Fantasy / Professional / Toyota interface styles with switcher (sidebar + Settings)
- Multicultural themed portraits for all agents in every style
- Custom agents (Amara, Kenji) with distinct names and portraits
- HMR-stable theme context

## Backend integration (per uploaded instructions + API_SPEC)
- [x] createRun sends full payload: goal + team + context.customer_id + quality_mode
- [x] POST /api/runs returns only { run_id, status: "PLANNING" } — recommendation arrives via polling GET /api/runs/{run_id} (normalizeRun maps recommendation → reward, audit_events → log)
- [x] planTeam normalizes backend agents: portrait from local PORTRAITS, description from purpose
- [x] Demo customers: GET /api/demo/customers + customer selector in Quest Forge
- [x] createDemoSession stays client-side (backend has no /demo-session)
- [x] VITE_API_BASE_URL=https://questmaster.tech/api (never raw IP:8000 — Caddy exposes only HTTPS)

## Open
- Flip VITE_USE_MOCK_API=false once the backend is live at questmaster.tech
- Eliška must add the frontend origin (Lovable preview/published URL) to the backend's CORS_ORIGINS
