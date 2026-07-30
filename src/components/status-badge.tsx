import { cn } from "@/lib/utils";
import type { StaffingStatus } from "@/lib/coverage";

const CONFIG: Record<StaffingStatus, { label: string; className: string }> = {
  full: {
    label: "Fully staffed",
    className: "bg-status-full/15 text-status-full border-status-full/30",
  },
  partial: {
    label: "Partially staffed",
    className: "bg-status-partial/15 text-status-partial border-status-partial/30",
  },
  empty: {
    label: "Empty",
    className: "bg-status-empty/15 text-status-empty border-status-empty/30",
  },
};

export function StatusBadge({ status, className }: { status: StaffingStatus; className?: string }) {
  const config = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
