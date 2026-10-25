import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Coins, DoorOpen, Loader2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteSavedTeam, getSavedTeam, saveTeam } from "@/api/client";
import { savedTeamsQueryOptions } from "@/api/saved-teams-query";
import type { SavedParty } from "@/api/types";
import { THEME_COPY, getPortrait, useTheme } from "@/lib/theme";
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
  const queryClient = useQueryClient();
  const { data: parties = [], isPending: loading, error } = useQuery(savedTeamsQueryOptions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const openTeam = (party: SavedParty) => {
    navigate({ to: "/create", search: { teamId: party.id } });
  };

  const duplicate = async (party: SavedParty) => {
    setBusyId(party.id);
    try {
      const original = await getSavedTeam(party.id);
      await saveTeam({ team: { ...original, id: crypto.randomUUID(), team_name: `${original.team_name} (Copy)` }, goal: original.goal });
      await queryClient.invalidateQueries({ queryKey: savedTeamsQueryOptions.queryKey });
      toast.success(`${party.name} duplicated.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not duplicate the team."); }
    finally { setBusyId(null); }
  };

  const remove = async (party: SavedParty) => {
    setBusyId(party.id);
    try {
      await deleteSavedTeam(party.id);
      await queryClient.invalidateQueries({ queryKey: savedTeamsQueryOptions.queryKey });
      toast.success(copy.toastTeamRemoved(party.name));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete the team."); }
    finally { setBusyId(null); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="gold-heading text-3xl font-bold">{copy.pages.teamsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy.pages.teamsSub}</p>
      {loading && <p role="status" className="mt-6 flex gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading teams...</p>}
      {error && <p role="alert" className="mt-6 text-destructive">{error.message}</p>}
      {!loading && !error && parties.length === 0 && <p className="mt-6 text-muted-foreground">No saved teams yet.</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {parties.map((party) => (
          <div key={party.id} className="parchment-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{party.name}</h2>
              <span className="chip-parchment !text-[10px]">
                <Users className="h-3 w-3" /> {party.memberIds.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{party.purpose}</p>

            <div className="mt-4 flex -space-x-3">
              {party.memberIds.map((id) => (
                <span key={id} className="relative">
                  <img
                    src={getPortrait(theme, id)}
                    alt="Team member"
                    loading="lazy"
                    width={816}
                    height={816}
                    className="agent-portrait-img h-11 w-11 rounded-full border-2 border-gold-dim object-cover object-top"
                  />
                  <span className="agent-portrait-initial h-11 w-11 rounded-full border-2 border-border font-display text-sm">
                    {id.charAt(0).toUpperCase()}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-ink-soft">
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-gold-dim" /> ~$
                {party.estimated_cost_usd.toFixed(2)} / run
              </span>
              <span className={cn("font-bold", STATUS_STYLES[party.last_run_status ?? "NEVER"])}>
                Last run: {(party.last_run_status ?? "NEVER").toLowerCase()}
              </span>
            </div>

            <hr className="divider-gold my-4" />

            <div className="mt-auto flex gap-2">
              <Button variant="default"
                disabled={busyId !== null}
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
                aria-label={`Delete ${party.name}`}
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
