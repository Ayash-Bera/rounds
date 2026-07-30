"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BatchSelect({
  batches,
  activeBatchId,
}: {
  batches: { id: string; label: string }[];
  activeBatchId: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={activeBatchId}
      onValueChange={(value) => router.push(`/dashboard/import/report?batch=${value}`)}
    >
      <SelectTrigger className="w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {batches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
