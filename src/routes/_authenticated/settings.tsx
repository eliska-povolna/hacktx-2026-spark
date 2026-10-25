import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cable, CircleUser, Palette } from "lucide-react";
import { toast } from "sonner";

import { getApiBaseUrl, getIntegrations, isMockMode } from "@/api/client";
import type { Integration } from "@/api/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Sanctum — QuestMaster" },
      { name: "description", content: "QuestMaster settings, profile, and integrations." },
      { property: "og:title", content: "Sanctum — QuestMaster" },
      { property: "og:description", content: "QuestMaster settings, profile, and integrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const STATUS_LABEL: Record<Integration["status"], string> = {
  CONNECTED: "Connected",
  HOSTED: "Hosted",
  AWAITING_BACKEND: "Awaiting backend",
  AWAITING_DEPLOYMENT: "Awaiting deployment",
};

function SettingsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    getIntegrations().then(setIntegrations).catch(() => toast.error("Could not load integrations."));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="gold-heading text-3xl font-bold">Sanctum</h1>
        <p className="mt-1 text-sm text-muted-foreground">Settings & integrations.</p>
      </div>

      {/* Profile */}
      <section className="parchment-panel p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <CircleUser className="h-5 w-5 text-gold-dim" /> Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-dim bg-arcane/20 font-display text-xl font-bold text-ink">
            {user?.name?.charAt(0) ?? "Q"}
          </div>
          <div>
            <div className="font-display text-lg font-bold text-ink">{user?.name ?? "Quest Master"}</div>
            <div className="text-sm text-ink-soft">{user?.email}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-crimson">
              {user?.title ?? "Quest Master"}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="parchment-panel p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Cable className="h-5 w-5 text-gold-dim" /> Integrations
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="parchment-inset p-4">
              <div className="font-display text-sm font-bold text-ink">{integration.label}</div>
              <div
                className={cn(
                  "mt-1 text-xs font-semibold",
                  integration.status === "CONNECTED" || integration.status === "HOSTED"
                    ? "text-forest"
                    : "text-crimson",
                )}
              >
                {STATUS_LABEL[integration.status]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interface */}
      <section className="parchment-panel p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Palette className="h-5 w-5 text-gold-dim" /> Interface
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">Theme</span>
          <span className="chip-parchment">Fantasy</span>
        </div>
      </section>

      {/* Backend connection */}
      <section className="parchment-panel p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Cable className="h-5 w-5 text-gold-dim" /> Backend Connection
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-soft">API Status</dt>
            <dd className="font-semibold text-forest">Operational (mock)</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-soft">Mock Mode</dt>
            <dd className="font-semibold text-ink">{isMockMode() ? "Enabled" : "Disabled"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-soft">Backend URL</dt>
            <dd className="truncate font-mono text-xs text-ink">{getApiBaseUrl()}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
