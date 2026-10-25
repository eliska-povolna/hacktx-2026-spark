<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- Project spec for QuestMaster lives in `docs/` (README, BUILD_PLAN, API_SPEC, DEMO_SCENARIOS); read it before building features. Why: it is the source of truth for the product.
- This project is frontend only; the backend is built elsewhere per `docs/QuestMaster_API_SPEC.md`. Why: team split — do not add Lovable Cloud or server logic here.
- Auth is client-side only (localStorage accounts/session in `src/lib/auth.tsx`), guarded by `_authenticated/route.tsx` with `ssr: false`. Why: project is frontend-only with no Lovable Cloud; swap for the real backend's session endpoints later.
- All API access goes through `src/api/client.ts` (mock mode via `VITE_USE_MOCK_API=true`); components never fetch directly. Why: switching to the real backend must only require env changes, per `docs/QuestMaster_API_SPEC.md`.
- Create uploads multipart attachments through the API client and forwards their IDs to planning and execution; it never issues team-save requests. Why: attachments are implemented externally, while team-saving endpoints are not approved for this flow.
- Fantasy UI uses reusable `@utility` classes in `src/styles.css` (parchment-panel, btn-crimson, chip-parchment, arcane-selected, gold-heading, wood-panel). Why: one parchment/panel system instead of per-component decoration.
- Generated and saved team configuration is authoritative across styles; only portraits and interface labels adapt, while sample overlays apply once during mock planning. Why: changing interface must never rewrite generated roles, tools, scopes or execution payloads.
- Saved-team CRUD goes through the external API contract in docs/QuestMaster_TEAM_BACKEND_PROMPTS.md; never fall back to mock rows or browser persistence in live mode. Why: persistence failures must remain visible and external backend ownership must stay explicit.
- Keep the theme context in its own asset-independent module and preserve its identity through Vite hot updates. Why: portrait/data edits must not disconnect mounted providers from consumers and blank the preview.
- Resolve unfamiliar live agent portraits through the shared identity-hashed theme pools, and reject fallback planner results in the API client. Why: every consumer gets stable themed imagery and failed plans cannot become usable teams.
- Normalize run summaries and audit categories in the central API client; render extended run data through RunDetails and shared result formatters. Why: live schemas, missing values, and provenance must remain consistent across pages without silent fixture substitution.
