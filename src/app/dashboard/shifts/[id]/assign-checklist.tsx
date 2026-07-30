"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { professionLabelPlural } from "@/lib/format";
import type { Profession } from "@/generated/prisma/enums";
import type { ClaimResult } from "@/lib/claims/db";

export type StaffRow = {
  id: string;
  fullName: string;
  profession: Profession;
  claimed: boolean;
};

const PROFESSION_ORDER: Profession[] = ["NURSE", "DOCTOR", "RECEPTIONIST"];

export function AssignChecklist({
  shiftId,
  staff,
  assignAction,
  removeAction,
}: {
  shiftId: string;
  staff: StaffRow[];
  assignAction: (shiftId: string, staffId: string) => Promise<ClaimResult>;
  removeAction: (shiftId: string, staffId: string) => Promise<ClaimResult>;
}) {
  const [rows, setRows] = useState(staff);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requestVersion = useRef<Record<string, number>>({});

  function toggle(id: string, checked: boolean) {
    // Flip immediately so the checkbox feels instant; the request confirms in the background.
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, claimed: checked } : r)));
    setErrors((prev) => ({ ...prev, [id]: "" }));

    const version = (requestVersion.current[id] ?? 0) + 1;
    requestVersion.current[id] = version;

    const action = checked ? assignAction : removeAction;
    action(shiftId, id).then((result) => {
      // A newer toggle on this row already superseded this request — ignore the stale result.
      if (requestVersion.current[id] !== version) return;
      if (!result.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, claimed: !checked } : r)));
        setErrors((prev) => ({ ...prev, [id]: result.reason }));
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
        No eligible staff found.
      </p>
    );
  }

  const groups = PROFESSION_ORDER.map((profession) => ({
    profession,
    members: rows.filter((r) => r.profession === profession),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="divide-y divide-border rounded-lg border">
      {groups.map((group) => {
        const claimedMembers = group.members.filter((m) => m.claimed);
        return (
          <div key={group.profession} className="px-4 py-2.5">
            <Popover>
              <PopoverTrigger className="flex w-full items-center justify-between gap-3 text-left">
                <span className="text-sm font-medium capitalize">
                  {professionLabelPlural(group.profession)}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {claimedMembers.length > 0
                    ? `${claimedMembers.length} assigned`
                    : `0 of ${group.members.length}`}
                  <ChevronDown className="h-4 w-4" />
                </span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-1">
                <ul className="max-h-72 overflow-y-auto">
                  {group.members.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                        <Checkbox
                          checked={s.claimed}
                          onCheckedChange={(checked) => toggle(s.id, checked === true)}
                        />
                        {s.fullName}
                      </label>
                      {errors[s.id] && (
                        <p className="px-2 pb-1 text-xs text-status-empty">{errors[s.id]}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
            {claimedMembers.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {claimedMembers.map((m) => m.fullName).join(", ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
