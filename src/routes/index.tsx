import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import { CrestLogo } from "@/components/CrestLogo";
import { useAuth } from "@/lib/auth";
import { DEMO_AUTH_NOTE, THEME_COPY, useTheme } from "@/lib/theme";
import bgRealm from "@/assets/bg-realm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — QuestMaster" },
      {
        name: "description",
        content:
          "Sign in to QuestMaster, the agent platform that assembles AI teams for your goals.",
      },
      { property: "og:title", content: "Sign In — QuestMaster" },
      {
        property: "og:description",
        content: "Welcome back. Your team awaits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/create", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password, remember);
      navigate({ to: "/create" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <img
        src={bgRealm}
        alt=""
        width={1920}
        height={1088}
        className="fantasy-only fixed inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="fantasy-only fixed inset-0 -z-10 bg-black/55" />

      <div className="parchment-panel w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <CrestLogo className="mb-3 h-16 w-16 text-gold-dim" />
          <h1 className="font-display text-3xl font-bold text-ink">{copy.brandName}</h1>
          <p className="mt-1 text-xs italic text-ink-soft">
            The best agent platform knows when not to use an agent.
          </p>
        </div>

        <h2 className="font-display text-xl font-semibold text-ink">{copy.auth.signInTitle}</h2>
        <p className="mb-5 text-sm text-ink-soft">{copy.auth.signInSub}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="parchment-inset w-full px-3 py-2 text-sm text-ink outline-none focus:border-gold-dim"
              placeholder="you@guild.example"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="parchment-inset w-full px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-gold-dim"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[oklch(0.5_0.16_25)]"
              />
              Remember session
            </label>
            <Link to="/reset-password" className="font-semibold text-crimson hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="rounded-md border border-crimson/50 bg-crimson/10 px-3 py-2 text-sm font-semibold text-crimson">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-crimson w-full px-4 py-2.5 text-sm">
            {pending ? copy.auth.signInPending : copy.auth.signInButton}
          </button>
        </form>

        <hr className="divider-gold my-5" />

        <p className="text-center text-sm text-ink-soft">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-crimson hover:underline">
            {copy.auth.signUpButton}
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] italic text-ink-soft">{DEMO_AUTH_NOTE}</p>
      </div>
    </div>
  );
}
