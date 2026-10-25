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
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { THEME_COPY, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV_ICONS = {
  create: Feather,
  teams: Users,
  reports: Scroll,
  logs: BookOpen,
  settings: Settings,
} as const;

const SAVED_PARTY_ICONS = [Gem, Users, Coins];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const navigate = useNavigate();

  const navItems = [
    { title: copy.nav.create, subtitle: copy.nav.createSub, to: "/create", icon: NAV_ICONS.create },
    { title: copy.nav.teams, subtitle: copy.nav.teamsSub, to: "/teams", icon: NAV_ICONS.teams },
    { title: copy.nav.reports, subtitle: copy.nav.reportsSub, to: "/reports", icon: NAV_ICONS.reports },
    { title: copy.nav.logs, subtitle: copy.nav.logsSub, to: "/logs", icon: NAV_ICONS.logs },
    { title: copy.nav.settings, subtitle: copy.nav.settingsSub, to: "/settings", icon: NAV_ICONS.settings },
  ] as const;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="quest-sidebar flex h-full min-h-0 flex-col overflow-hidden">
      {/* Brand */}
      <div className="sidebar-brand flex shrink-0 items-center gap-3 px-5 pt-6 pb-4">
        <CrestLogo className="h-11 w-11 text-gold" />
        <div>
          <div className="font-display text-xl font-bold tracking-wide text-gold-bright">
            {copy.brandName}
          </div>
          <div className="whitespace-pre-line text-[11px] leading-tight text-muted-foreground">
            {copy.brandTagline}
          </div>
        </div>
      </div>

      <hr className="divider-gold mx-4 shrink-0" />

      {/* Navigation */}
      <nav className="sidebar-navigation mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = currentPath === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "sidebar-nav-link flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                active
                  ? "border-arcane bg-arcane/25 text-foreground shadow-[0_0_16px_oklch(0.6_0.18_260/35%)]"
                  : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-arcane-bright" : "text-gold-dim")} />
              <span>
                <span className="block font-display text-sm font-semibold">{item.title}</span>
                <span className="sidebar-nav-subtitle block text-[11px] text-muted-foreground">{item.subtitle}</span>
              </span>
            </Link>
          );
        })}

        {/* Saved parties */}
        <div className="sidebar-saved-parties pt-5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dim">
            {copy.savedParties}
          </div>
          {copy.savedTeamNames.map((name, i) => {
            const PartyIcon = SAVED_PARTY_ICONS[i % SAVED_PARTY_ICONS.length] ?? Gem;
            return (
              <Link
                key={name}
                to="/teams"
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent"
              >
                <PartyIcon className="h-4 w-4 text-gold-dim" />
                {name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom decoration + user */}
      <div className="sidebar-footer shrink-0 px-5 pt-3 pb-5">
        <div className="sidebar-quote fantasy-only mb-4 rounded-md border border-gold-dim/40 bg-wood-deep/60 p-3 text-center">
          <Flame className="mx-auto mb-1 h-4 w-4 text-gold" />
          <p className="font-display text-[11px] italic leading-snug text-gold/80">
            {copy.quote}
          </p>
        </div>
        <div className="mb-3">
          <ThemeSwitcher compact />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-crimson"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

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
        <CrestLogo className="h-7 w-7 shrink-0 text-gold" />
        <span className="min-w-0 flex-1 truncate font-display text-lg font-bold text-gold-bright">
          {THEME_COPY[theme].brandShort}
        </span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="wood-panel absolute left-0 top-0 h-dvh w-72">
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
      <aside className="wood-panel sticky top-0 hidden h-dvh w-72 shrink-0 lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
