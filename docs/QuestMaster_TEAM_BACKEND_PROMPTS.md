# Backend prompty: tvorba a ukládání týmů

Frontend je připravený na níže uvedený kontrakt, backend zde nebyl změněn. Dne 25. 10. 2026 živé `GET https://questmaster.tech/api/teams` vracelo 404. `POST /api/teams/plan` na fantasy zadání vrátil správný hospitality tým, nikoli Toyota tým.

## Prompt 1 — plánování podle skutečného zadání

```text
Uprav existující FastAPI POST /api/teams/plan. Zachovej provider, model, rozpočty,
fallback pravidla a stávající response {team, planner_source, fallback_used}.
Request je {goal, interface_theme: "fantasy" | "professional" | "toyota",
max_team_size: 5, budget_preference: "balanced"}.

Goal je autoritativní zadání; interface_theme je kontext počátečního ukázkového
zadání, ne pokyn přepsat uživatelem napsaný cíl. Nepřidávej automaticky Toyota
instrukce, data, role ani nástroje do fantasy/professional zakázek.
Toyota fallback použij jen pro skutečné mobility zadání. Fallback pro ostatní
domény musí odpovídat goal a být označen planner_source=FALLBACK.
Nevymýšlej dostupné nástroje nebo oprávnění. Validuj allowed_tools, scopes,
actions a budget serverově. Žádný frontendový theme nesmí rozšiřovat oprávnění.

Každá úspěšná generace má vytvořit NOVÝ záznam týmu v databázi (nezávisle na
tom, zda planner opakuje team.id). Ulož celé agent definitions, původní goal,
interface_theme a UTC časy v transakci před úspěšnou odpovědí. Vrať navíc
saved_team: SavedTeam dle promptu 2; frontend pak nevolá druhý POST /teams.
Při selhání ukládání neoznamuj, že výsledek je uložen; vrať bezpečnou chybu.
Nikdy neukládej interní system prompt, chain-of-thought nebo klíče do odpovědi.

Testy: fantasy hospitality goal vytvoří hospitality agenty; professional
customer-feedback goal neobsahuje automatický Toyota kontext; Toyota mobility
goal používá správné mobility nástroje; vlastní hospitality goal v Toyota
zůstane hospitality; opakované plánování vytvoří dva samostatné záznamy.
```

## Prompt 2 — databáze a bezpečný CRUD uložených týmů

```text
V existujícím backendu QuestMaster přidej databázové ukládání celých týmů.
Použij stávající databázi a migrace, nikoli paměť procesu nebo JSON soubor.
Nepřidávej Lovable Cloud. API je pod https://questmaster.tech/api přes Caddy;
FastAPI port 8000 zůstává neveřejný.

SaveTeamInput:
{team: {id, team_name, summary, agents: AgentDefinition[]}, goal: string,
 interface_theme: "fantasy" | "professional" | "toyota"}
SavedTeam:
{id: serverem vytvořené UUID, team_name, summary, agents: AgentDefinition[],
 goal, interface_theme, created_at: ISO UTC, updated_at: ISO UTC,
 last_run_status?: "COMPLETED" | "FAILED" | "RUNNING" | "NEVER"}
AgentDefinition je existující kontrakt (id, name, role, purpose, description?,
skills, instructions, allowed_tools, permissions:{data_scopes,actions},
guardrails, model_policy, budget, estimated_cost_usd).
Portrait a frontend customized flag nejsou autoritativní data; ignoruj je.
Výsledek konfigurace při čtení neměň podle aktuálního interface.

Endpointy:
GET /api/teams => 200 {teams: SavedTeam[]} (nejnovější první)
POST /api/teams body SaveTeamInput => 201 {team: SavedTeam}
GET /api/teams/{id} => 200 {team: SavedTeam}
PUT /api/teams/{id} body SaveTeamInput => 200 {team: SavedTeam}
DELETE /api/teams/{id} => 204 bez těla
Registruj statický /teams/plan před dynamickým /teams/{id}.
POST vždy vytváří nový tým; PUT zachová id, ownership a created_at, změní
updated_at. Nahrazuj konfiguraci atomicky. Neplatný vstup => 422; neexistující
nebo cizí tým => 404. Zachovej možnost poslat úplný team snapshot do /runs.
Validuj velikost týmů, unikátní agent ID, rozpočty, nástroje i oprávnění.

Bezpečnost: existující frontend přihlášení je pouze lokální demo a nedokazuje
identitu. Nikdy nepovažuj email/user_id z localStorage ani z body za důkaz
vlastnictví. Pro produkci doplň skutečnou serverově ověřenou session a
workspace-scoped ownership. Pro Continue with Demo může backend vydat
náhodnou HttpOnly Secure session cookie s TTL a vlastní oddělený demo workspace;
vyřeš SameSite a CSRF pro povolené frontend origins. Nikdy neotevírej veřejný
globální seznam/editaci/smazání všech týmů. Auth session kontrakt a CORS
credentials dohodni s frontendem před vyžadováním nového auth flow; současné
team CRUD volání žádný věrohodný token neposílá. Do té doby vrať bezpečné 401,
ne falešně veřejnou persistenci. Demo session data pravidelně expiruj.

Testy: každý plan uloží plný tým; záznam přežije restart; list/detail vrátí
stejnou konfiguraci; PUT uloží editaci/add/remove agenta; duplikace má nové ID;
DELETE odstraní tým; jiná session nemůže tým číst ani měnit; selhání DB není
hlášeno jako úspěch. Vše ověř přes Caddy HTTPS.
```

## Prompt 3 — integrace a akceptační kontrola

```text
Povol v CORS přesné frontend origins https://hacktx-2026-spark.lovable.app,
https://id-preview--1822652e-47c8-4da8-ba55-6c900a2db286.lovable.app a podle
potřeby http://localhost:8080. Nepoužívej wildcard s cookies. Povol potřebné
GET/POST/PUT/DELETE/OPTIONS, Content-Type a auth headers podle session kontraktu.

Ověř: zvolit Fantasy, spustit zobrazený prompt, zobrazit uložený tým; přepnout
Professional/Toyota a dostat stejné names/roles/skills/tools/scopes/budgets,
pouze jinou grafiku; otevřít Teams, stejný tým otevřít přes teamId; upravit
agenta, Save Team, obnovit stránku a ověřit změnu; zopakovat nové plánování
pro všechna tři zadání a potvrdit tři samostatné databázové záznamy.
Vrať výstup testů, seznam migračních změn a přesný auth/session kontrakt pro
navazující frontend napojení. Neměň model ani existující run polling kontrakt.
```