import { cn } from "@/lib/utils";
import type { ExecutorType } from "@/api/types";

const STYLES: Record<ExecutorType, string> = {
  TOOL: "bg-[oklch(0.55_0.12_210)] text-white",
  CODE: "bg-[oklch(0.5_0.14_150)] text-white",
  LLM: "bg-[oklch(0.55_0.18_300)] text-white",
};

export function ExecutorBadge({
  executor,
  className,
}: {
  executor: ExecutorType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
        STYLES[executor],
        className,
      )}
    >
      {executor}
    </span>
  );
}
