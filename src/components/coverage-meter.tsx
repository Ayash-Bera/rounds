import { cn } from "@/lib/utils";
import type { StaffingStatus } from "@/lib/coverage";

export const STATUS_COLOR: Record<StaffingStatus, string> = {
  full: "var(--status-full)",
  partial: "var(--status-partial)",
  empty: "var(--status-empty)",
};

export function CoverageMeter({
  filled,
  needed,
  status,
  className,
}: {
  filled: number;
  needed: number;
  status: StaffingStatus;
  className?: string;
}) {
  const color = STATUS_COLOR[status];
  const pct = needed === 0 ? 0 : Math.min(100, Math.round((filled / needed) * 100));

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative h-3 w-7 shrink-0 overflow-hidden rounded-[2px] bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-[2px]"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="font-mono text-xs tabular-nums" style={{ color }}>
        {needed === 0 ? "n/a" : `${filled}/${needed}`}
      </span>
    </span>
  );
}
