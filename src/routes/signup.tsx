import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { CrestLogo } from "@/components/CrestLogo";
import { useAuth } from "@/lib/auth";
import { DEMO_AUTH_NOTE, THEME_COPY, useTheme } from "@/lib/theme";
import bgRealm from "@/assets/bg-realm.jpg";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — QuestMaster" },
      {
        name: "description",
        content: "Join QuestMaster and start assembling AI agent teams.",
      },
      { property: "og:title", content: "Sign Up — QuestMaster" },
      { property: "og:description", content: "Join QuestMaster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await signup(name, email, password);
      navigate({ to: "/create" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setPending(false);
    }
  };

  const fieldClass =
    "parchment-inset w-full px-3 py-2 text-sm text-ink outline-none focus:border-gold-dim";
  const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft";

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
          <CrestLogo className="mb-3 h-14 w-14 text-gold-dim" />
          <h1 className="font-display text-2xl font-bold text-ink">{copy.auth.signUpTitle}</h1>
          <p className="mt-1 text-sm text-ink-soft">{copy.auth.signUpSub}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>Display name</label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Avery"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              placeholder={copy.emailPlaceholder}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className={labelClass}>Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={fieldClass}
              placeholder="Repeat your password"
            />
          </div>

          {error && (
            <p className="rounded-md border border-crimson/50 bg-crimson/10 px-3 py-2 text-sm font-semibold text-crimson">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-crimson w-full px-4 py-2.5 text-sm">
            {pending ? copy.auth.signUpPending : copy.auth.signUpButton}
          </button>
        </form>

        <hr className="divider-gold my-5" />

        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to="/" className="font-semibold text-crimson hover:underline">
            {copy.auth.signInButton}
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] italic text-ink-soft">{DEMO_AUTH_NOTE}</p>
      </div>
    </div>
  );
}
