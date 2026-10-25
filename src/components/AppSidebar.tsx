import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Coins,
  Feather,
  Flame,
  Gem,
  LogOut,
  Menu,
  Scroll,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { CrestLogo } from "@/components/CrestLogo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Quest Forge", subtitle: "Create new quests", to: "/create", icon: Feather },
  { title: "Adventuring Parties", subtitle: "Manage your teams", to: "/teams", icon: Users },
  { title: "Chronicles", subtitle: "Reports & insights", to: "/reports", icon: Scroll },
  { title: "Quest Log", subtitle: "Activity & execution logs", to: "/logs", icon: BookOpen },
  { title: "Sanctum", subtitle: "Settings & integrations", to: "/settings", icon: Settings },
] as const;

const SAVED_PARTIES = [
  { name: "Merchant Insight Party", icon: Gem },
  { name: "Support Guild", icon: Users },
  { name: "Market Watchers", icon: Coins },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <CrestLogo className="h-11 w-11 text-gold" />
        <div>
          <div className="font-display text-xl font-bold tracking-wide text-gold-bright">
            QuestMaster
          </div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            The best agent platform
            <br />
            knows when not to use an agent.
          </div>
        </div>
      </div>

      <hr className="divider-gold mx-4" />

      {/* Navigation */}
      <nav className="mt-3 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                active
                  ? "border-arcane bg-arcane/25 text-foreground shadow-[0_0_16px_oklch(0.6_0.18_260/35%)]"
                  : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-arcane-bright" : "text-gold-dim")} />
              <span>
                <span className="block font-display text-sm font-semibold">{item.title}</span>
                <span className="block text-[11px] text-muted-foreground">{item.subtitle}</span>
              </span>
            </Link>
          );
        })}

        {/* Saved parties */}
        <div className="pt-5">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-[0.2em] text-gold-dim">
            SAVED PARTIES
          </div>
          {SAVED_PARTIES.map((party) => (
            <Link
              key={party.name}
              to="/teams"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent"
            >
              <party.icon className="h-4 w-4 text-gold-dim" />
              {party.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom decoration + user */}
      <div className="px-5 pb-5">
        <div className="mb-4 rounded-md border border-gold-dim/40 bg-wood-deep/60 p-3 text-center">
          <Flame className="mx-auto mb-1 h-4 w-4 text-gold" />
          <p className="font-display text-[11px] italic leading-snug text-gold/80">
            “Good questions lead to greater journeys.”
          </p>
        </div>
        <hr className="divider-gold mb-3" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-dim bg-arcane/30 font-display text-sm font-bold text-gold-bright">
            {user?.name?.charAt(0) ?? "Q"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user?.name ?? "Quest Master"}</div>
            <div className="text-[11px] text-muted-foreground">{user?.title ?? "Quest Master"}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Leave the guild (log out)"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-crimson"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-gold-dim/40 bg-wood-deep/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-gold hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <CrestLogo className="h-7 w-7 text-gold" />
        <span className="font-display text-lg font-bold text-gold-bright">QuestMaster</span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="wood-panel absolute inset-y-0 left-0 w-72">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 rounded-md p-1.5 text-gold hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="wood-panel sticky top-0 hidden h-screen w-72 shrink-0 lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
