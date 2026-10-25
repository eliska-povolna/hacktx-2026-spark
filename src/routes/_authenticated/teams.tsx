import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Coins, DoorOpen, Loader2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteSavedTeam, getSavedTeams, isMockMode, saveTeam } from "@/api/client";
import type { SavedTeam } from "@/api/types";
import { THEME_COPY, getAgentsForTheme, useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/teams")({
  head: () => ({
    meta: [
      { title: "Teams — QuestMaster" },
      {
        name: "description",
        content: "Manage your saved QuestMaster agent teams.",
      },
      { property: "og:title", content: "Teams — QuestMaster" },
      { property: "og:description", content: "Manage your saved QuestMaster agent teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamsPage,
});

const STATUS_STYLES = {
  COMPLETED: "text-forest",
  FAILED: "text-crimson",
  RUNNING: "text-arcane-bright",
  NEVER: "text-muted-foreground",
};

function TeamsPage() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [parties, setParties] = useState<SavedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const openTeam = (party: SavedTeam) => {
    navigate({ to: "/create", search: { teamId: party.id } });
  };

  useEffect(() => {
    getSavedTeams().then(setParties).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const duplicate = async (party: SavedTeam) => {
    setBusyId(party.id);
    try {
      const saved = await saveTeam({ team: { ...party, id: crypto.randomUUID(), team_name: `${party.team_name} (Copy)` },
        goal: party.goal, interface_theme: party.interface_theme });
      setParties((prev) => [...prev, saved]);
      toast.success(`${party.team_name} duplicated.`);
    } catch { toast.error("Could not duplicate the team."); }
    finally { setBusyId(null); }
  };

  const remove = async (party: SavedTeam) => {
    setBusyId(party.id);
    try {
      await deleteSavedTeam(party.id);
      setParties((prev) => prev.filter((p) => p.id !== party.id));
      toast.success(copy.toastTeamRemoved(party.team_name));
    } catch { toast.error("Could not delete the team."); }
    finally { setBusyId(null); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.teamsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.teamsSub}</p>
      {loading && <p role="status" className="mt-6 flex gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading teams...</p>}
      {error && <p role="alert" className="mt-6 text-destructive">Saved teams could not be loaded. Please try again later.</p>}
      {!loading && !error && parties.length === 0 && <p className="mt-6 text-muted-foreground">No saved teams yet.</p>}
      {isMockMode() && <p className="mt-2 text-xs text-muted-foreground">Demo teams · this session only</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {parties.map((party) => (
          <div key={party.id} className="parchment-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{party.team_name}</h2>
              <span className="chip-parchment !text-[10px]">
                <Users className="h-3 w-3" /> {party.agents.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{party.summary}</p>

            <div className="mt-4 flex -space-x-3">
              {getAgentsForTheme(theme, party.agents).map((agent) => (
                <span key={agent.id} className="relative">
                  <img
                    src={agent.portrait}
                    alt={agent.name}
                    loading="lazy"
                    width={816}
                    height={816}
                    className="agent-portrait-img h-11 w-11 rounded-full border-2 border-gold-dim object-cover object-top"
                  />
                  <span className="agent-portrait-initial h-11 w-11 rounded-full border-2 border-border font-display text-sm">
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-ink-soft">
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-gold-dim" /> ~$
                {party.agents.reduce((sum, agent) => sum + agent.estimated_cost_usd, 0).toFixed(2)} / run
              </span>
              <span className={cn("font-bold", STATUS_STYLES[party.last_run_status ?? "NEVER"])}>
                Last run: {(party.last_run_status ?? "NEVER").toLowerCase()}
              </span>
            </div>

            <hr className="divider-gold my-4" />

            <div className="mt-auto flex gap-2">
              <Button variant="default"
                onClick={() => openTeam(party)}
                className="btn-crimson flex-1 px-3 py-1.5 text-xs"
              >
                <DoorOpen className="h-3.5 w-3.5" /> {copy.openTeam}
              </Button>
              <Button variant="outline" disabled={busyId !== null}
                onClick={() => duplicate(party)}
                className="btn-outline-gold px-3 py-1.5 text-xs !text-ink"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </Button>
              <Button variant="ghost" size="icon" disabled={busyId !== null}
                onClick={() => remove(party)}
                aria-label={`Delete ${party.team_name}`}
                className="rounded-md border border-crimson/60 px-2.5 text-crimson hover:bg-crimson/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
