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
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap font-mono text-xs tabular-nums",
        className,
      )}
      style={{ color: STATUS_COLOR[status] }}
    >
      {needed === 0 ? "n/a" : `${filled}/${needed}`}
    </span>
  );
}
