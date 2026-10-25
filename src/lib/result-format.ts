export function humanize(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  if (!value.includes("_") && value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatMoney(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2 }).format(value);
}

export function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  // Backend timestamps are UTC; toLocaleString renders the viewer's local zone.
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
      : {}),
  });
}

export function formatDuration(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "Unavailable";
  const seconds = value / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}