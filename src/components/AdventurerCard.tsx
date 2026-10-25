import { CheckCircle2 } from "lucide-react";

import type { AgentDefinition } from "@/api/types";
import { THEME_COPY, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AdventurerCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full overflow-hidden rounded-lg border border-gold-dim/60 bg-card text-left shadow-[0_10px_24px_-12px_oklch(0_0_0/70%)] transition-all hover:-translate-y-0.5 hover:border-gold",
        selected && "arcane-selected",
      )}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={agent.portrait}
          alt={`Portrait of ${agent.name}`}
          loading="lazy"
          width={816}
          height={816}
          className="agent-portrait-img h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
        <div className="agent-portrait-initial h-full w-full">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card font-display text-2xl font-bold text-foreground">
            {agent.name.charAt(0)}
          </span>
        </div>
        <span className="agent-ready-badge absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <CheckCircle2 className="h-3 w-3" /> {copy.ready}
        </span>
      </div>
      <div className="p-3">
        <div className="font-display text-base font-bold text-gold-bright">{agent.name}</div>
        <div className="text-xs text-muted-foreground">{agent.role}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="chip-dark !px-2 !py-0.5 !text-[10px]">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
