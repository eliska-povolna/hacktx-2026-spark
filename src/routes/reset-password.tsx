import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { CrestLogo } from "@/components/CrestLogo";
import { useAuth } from "@/lib/auth";
import { DEMO_AUTH_NOTE, THEME_COPY, useTheme } from "@/lib/theme";
import bgRealm from "@/assets/bg-realm.jpg";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — QuestMaster" },
      { name: "description", content: "Recover your QuestMaster account access." },
      { property: "og:title", content: "Reset Password — QuestMaster" },
      { property: "og:description", content: "Recover your QuestMaster account access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

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
      await resetPassword(email, password);
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
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
          <h1 className="font-display text-2xl font-bold text-ink">{copy.auth.resetTitle}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {copy.auth.resetSub}
          </p>
        </div>

        {done ? (
          <p className="rounded-md border border-forest/60 bg-forest/15 px-3 py-3 text-center text-sm font-semibold text-ink">
            Your password has been renewed. Returning to the guild gates...
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="you@guild.example"
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>New password</label>
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
              <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass}
                placeholder="Repeat your new password"
              />
            </div>

            {error && (
              <p className="rounded-md border border-crimson/50 bg-crimson/10 px-3 py-2 text-sm font-semibold text-crimson">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn-crimson w-full px-4 py-2.5 text-sm">
              {pending ? "Rewriting the seal..." : "Set New Password"}
            </button>
          </form>
        )}

        <hr className="divider-gold my-5" />

        <p className="text-center text-sm text-ink-soft">
          Remembered it after all?{" "}
          <Link to="/" className="font-semibold text-crimson hover:underline">
            {copy.auth.signInButton}
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] italic text-ink-soft">{DEMO_AUTH_NOTE}</p>
      </div>
    </div>
  );
}
