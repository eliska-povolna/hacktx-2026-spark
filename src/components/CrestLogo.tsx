import { cn } from "@/lib/utils";

// Original QuestMaster crest: a quest-star compass inside an antique gold ring.
export function CrestLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("h-10 w-10", className)}
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* quest star / compass rose */}
      <path
        d="M32 10 L36.5 27.5 L54 32 L36.5 36.5 L32 54 L27.5 36.5 L10 32 L27.5 27.5 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 20 L34.5 29.5 L44 32 L34.5 34.5 L32 44 L29.5 34.5 L20 32 L29.5 29.5 Z"
        fill="oklch(0.16 0.02 60)"
      />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
      {/* small dragon-ish wing accents */}
      <path d="M8 22 Q14 24 15 30 Q10 27 8 22 Z" fill="currentColor" opacity="0.7" />
      <path d="M56 22 Q50 24 49 30 Q54 27 56 22 Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
