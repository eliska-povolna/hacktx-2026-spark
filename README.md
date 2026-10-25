# QuestMaster

HackTX 2026 frontend for a cost-aware agent-team prototype.

**Live demo:** https://questmaster.tech

Agents declare **responsibility**; the platform routes each step to **CODE**, **TOOL**, or **LLM**. The UI lets you assemble a team, enable context sources, run it, and reopen results. This repo is frontend-only — the FastAPI backend and connectors live elsewhere (see `docs/`).

## Try the live demo

1. Open https://questmaster.tech
2. Pick a guest path:
   - **Launch Toyota Mobility Demo** — switches the interface to Toyota and opens Create
   - **Continue with Demo** / fantasy guest — keeps the current style (Fantasy by default)
3. On Create, use the sample goal or write your own, then **Assemble** / **Build Decision Team**
4. Toggle context chips (**On** / **Off**) as needed, then **Run Team**
5. Reopen finished runs from **Reports** / **Chronicles** / **Insights** via **Open**

Guest auth is browser-local for the hackathon — not production identity. Guest sessions last for the tab.

## What each style is for

| Style | Default sample | Connectors to run |
| --- | --- | --- |
| **Fantasy** (default) | Connector-free `simple_play` (e.g. rock-paper-scissors) | None required |
| **Professional** / **Toyota** | Mobility decision sample | **Toyota customer context** on; **Nessie banking** on for financial / portfolio shortlists |

Style only changes portraits and labels. Generated roles, tools, scopes, and run payloads stay the same when you switch themes.

Toyota story in one line: **same vehicle, different financial reality, different recommendation** — synthetic Toyota profile/vehicle/lease/usage plus Capital One Nessie-derived financial context. Recommendations are guidance only; nothing submits a loan, lease, or transaction.

Demo customers include Sarah Miller, Jordan Lee, Alex Kim (no-action), and loan/portfolio candidates such as Priya Shah. Pick a customer after assemble when the team is single-customer mobility (not portfolio).

## Context chips and Run Team

- **Fantasy** starts with Toyota/Nessie chips **Off** so freeform / `simple_play` goals can run without connectors.
- **Toyota** / **Professional** auto-enable installed demo sources; chips show **On** / **Off** — clicking an **On** chip turns it off.
- Mobility teams need **Toyota customer context** enabled to run. Portfolio shortlists also need **Nessie banking**.
- If Run cannot start, the button still responds with a toast explaining what to turn on.

## Services (from the live API)

Integration status is whatever `GET /api/integrations` returns (typically Capital One Nessie, Tiger Data, Vultr, and the LLM provider). That list is status reporting, not a health SLA.

- Saved teams: Tiger-backed `GET` / `POST` / `DELETE` `/teams` (no fake browser persistence on failure)
- Activity: `/api/audit-events`
- Reports: `/api/runs` list + `/api/runs/{id}` detail (Open loads the full run)

All frontend API access goes through `src/api/client.ts`.

## Run locally

Requires [Bun](https://bun.sh):

```sh
bun install
cp .env.example .env
bun run dev
```

`.env.example` defaults to the live API:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://questmaster.tech/api
```

Set `VITE_USE_MOCK_API=true` only for explicit local mock fixtures (session-only; not a substitute for saved teams). Your origin must be allowed by the API’s CORS policy.

```sh
bun run test
bun run lint
bun run build
```

Stack: React 19, TanStack Start, Tailwind CSS. Product / API specs and demo scenarios: `docs/`.
