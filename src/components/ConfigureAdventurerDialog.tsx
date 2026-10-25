import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import type { AgentDefinition } from "@/api/types";
import { THEME_COPY, useTheme } from "@/lib/theme";

interface Props {
  agent: AgentDefinition | null;
  onClose: () => void;
  onSave: (agent: AgentDefinition) => void;
  onRemove: (id: string) => void;
}

const fieldClass =
  "parchment-inset w-full px-3 py-2 text-sm text-ink outline-none focus:border-gold-dim";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft";

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="chip-parchment">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-crimson hover:text-crimson-deep"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...items, draft.trim()]);
                setDraft("");
              }
            }
          }}
          className={fieldClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => {
            if (draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
          className="btn-outline-gold shrink-0 px-3 text-xs !text-ink"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

export function ConfigureAdventurerDialog({ agent, onClose, onSave, onRemove }: Props) {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [draft, setDraft] = useState<AgentDefinition | null>(agent);

  useEffect(() => {
    setDraft(agent);
  }, [agent]);

  if (!draft) return null;

  const update = (patch: Partial<AgentDefinition>) => setDraft({ ...draft, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="parchment-panel relative max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">{copy.configureTitle}</h3>
            <p className="text-xs text-ink-soft">Changes are kept in this session only.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input value={draft.name} onChange={(e) => update({ name: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input value={draft.role} onChange={(e) => update({ role: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Purpose</label>
            <textarea
              value={draft.purpose}
              onChange={(e) => update({ purpose: e.target.value })}
              rows={2}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Model policy</label>
            <input
              value={draft.model_policy}
              onChange={(e) => update({ model_policy: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Budget ($ / run)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={draft.budget.max_llm_cost_usd}
                onChange={(e) =>
                  update({ budget: { ...draft.budget, max_llm_cost_usd: Number(e.target.value) } })
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max AI calls</label>
              <input
                type="number"
                min={0}
                step={1}
                value={draft.budget.max_llm_calls}
                onChange={(e) =>
                  update({ budget: { ...draft.budget, max_llm_calls: Number(e.target.value) } })
                }
                className={fieldClass}
              />
            </div>
          </div>

          <ListEditor
            label="Skills"
            items={draft.skills}
            onChange={(skills) => update({ skills })}
            placeholder="Add a skill"
          />
          <ListEditor
            label={copy.toolsTitle}
            items={draft.allowed_tools}
            onChange={(allowed_tools) => update({ allowed_tools })}
            placeholder="Add a tool"
          />
          <ListEditor
            label="Permissions (data scopes)"
            items={draft.permissions.data_scopes}
            onChange={(data_scopes) => update({ permissions: { ...draft.permissions, data_scopes } })}
            placeholder="Add a data scope"
          />
          <ListEditor
            label="Guardrails"
            items={draft.guardrails}
            onChange={(guardrails) => update({ guardrails })}
            placeholder="Add a guardrail"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onRemove(draft.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-crimson/60 px-3 py-2 text-xs font-semibold text-crimson hover:bg-crimson/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> {copy.removeAgent}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline-gold px-4 py-2 text-xs !text-ink">
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="btn-crimson px-4 py-2 text-xs"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
