# QuestMaster

HackTX 2026 agent responsibility and execution-routing prototype.

**Live demo:** https://questmaster.tech

Agents define responsibility; the platform chooses **CODE**, **TOOL**, or **LLM** execution. Teams expose tools, permissions, guardrails and budgets, while runs show decision traces and cost/efficiency metrics.

## Toyota mobility demo

Use **Launch Toyota Mobility Demo** on the sign-in page, assemble a team, select Sarah Miller or Jordan Lee, and run it.

**Same vehicle. Different financial reality. Different recommendation.** Capital One Nessie live banking integration provides financial context; synthetic vehicle and financing assumptions support the hackathon scenario. Recommendations are guidance, not executed finance applications or contract transactions.

Fantasy is the default brand experience. Professional and Toyota are alternative presentation modes; switching styles preserves generated team configuration and results. Generic **Continue with Demo** does not change the selected style.

## Services and prototype boundaries

The external API reports integrations with **Capital One Nessie**, **Tiger Data**, and **Vultr**. The public demo uses a **.tech** domain. This repository contains only the frontend; backend implementation is owned separately (see `docs/`). Integration status is read from the API, not a guarantee of service health.

Authentication is browser-local demo authentication, not production identity. Guest sessions last for the tab session. Live saved teams require the external persistence endpoints; failures are shown explicitly, never replaced with fake account data. Global Activity requires `/api/audit-events`; historical reports depend on the fields supplied by `/api/runs`.

## Run locally

With Bun installed:

```sh
bun install
cp .env.example .env
bun run dev
```

Production uses `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=https://questmaster.tech/api`. Use `VITE_USE_MOCK_API=true` only for explicit local mock mode. Mock teams are session-only fixtures, not database persistence. The external API must allow your frontend origin through CORS.

```sh
bun run test
bun run lint
bun run build
```

Built with React 19, TanStack Start and Tailwind CSS. Product and API documentation lives in `docs/`.
