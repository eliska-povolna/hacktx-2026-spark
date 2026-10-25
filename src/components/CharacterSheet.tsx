import {
  BookOpen,
  Brain,
  CheckCircle2,
  Coins,
  Crosshair,
  Scale,
  Settings2,
  Shield,
  Wrench,
} from "lucide-react";

import type { AgentDefinition } from "@/api/types";
import { THEME_COPY, useTheme } from "@/lib/theme";

interface CharacterSheetProps {
  agent: AgentDefinition;
  onConfigure: () => void;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink">
        <Icon className="h-3.5 w-3.5 text-gold-dim" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function CharacterSheet({ agent, onConfigure }: CharacterSheetProps) {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];

  return (
    <section className="parchment-panel p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="shrink-0">
          <img
            src={agent.portrait}
            alt={`Portrait of ${agent.name}`}
            loading="lazy"
            width={816}
            height={816}
            className="agent-portrait-img h-44 w-36 rounded-md border border-gold-dim object-cover object-top shadow-md"
          />
          <div className="agent-portrait-initial h-44 w-36 rounded-md border border-border font-display text-5xl">
            {agent.name.charAt(0)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-2xl font-bold text-ink">
                {agent.name}{" "}
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-forest/15 px-2 py-0.5 align-middle text-[11px] font-semibold text-forest">
                  <CheckCircle2 className="h-3 w-3" /> {copy.ready}
                </span>
              </h3>
              <p className="font-display text-sm font-semibold text-crimson">{agent.role}</p>
            </div>
            <button onClick={onConfigure} className="btn-crimson px-3 py-1.5 text-xs">
              <Settings2 className="h-3.5 w-3.5" /> {copy.configure}
            </button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{agent.description}</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Section icon={Crosshair} title="Role">
              <p className="text-sm text-ink">{agent.role}</p>
            </Section>
            <Section icon={BookOpen} title="Purpose">
              <p className="text-sm text-ink">{agent.purpose}</p>
            </Section>
            <Section icon={Wrench} title="Skills">
              <div className="flex flex-wrap gap-1">
                {agent.skills.map((s) => (
                  <span key={s} className="chip-parchment">{s}</span>
                ))}
              </div>
            </Section>
            <Section icon={Wrench} title={copy.toolsTitle}>
              <ul className="space-y-0.5 text-sm text-ink">
                {agent.allowed_tools.map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gold-dim" /> {t}
                  </li>
                ))}
              </ul>
            </Section>
            <Section icon={Shield} title="Access / Permissions">
              <ul className="space-y-0.5 text-sm text-ink">
                {agent.permissions.data_scopes.map((s) => (
                  <li key={s} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-forest" /> {s.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </Section>
            <Section icon={Scale} title="Guardrails">
              <ul className="space-y-0.5 text-sm text-ink">
                {agent.guardrails.map((g) => (
                  <li key={g} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-forest" /> {g}
                  </li>
                ))}
              </ul>
            </Section>
            <Section icon={Coins} title="Budget">
              <p className="text-sm text-ink">
                ~ ${agent.budget.max_llm_cost_usd.toFixed(2)} / run · max {agent.budget.max_llm_calls} AI calls
              </p>
            </Section>
            <Section icon={Brain} title="Model Policy">
              <p className="text-sm italic text-ink">{agent.model_policy}</p>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}
