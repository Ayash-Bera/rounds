import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BatchSelect } from "./batch-select";

const STATUS_VARIANT: Record<string, string> = {
  ACCEPTED: "bg-status-full/15 text-status-full border-status-full/30",
  MERGED: "bg-status-partial/15 text-status-partial border-status-partial/30",
  REJECTED: "bg-status-empty/15 text-status-empty border-status-empty/30",
};

export default async function ImportReportPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  await requireManager();
  const { batch } = await searchParams;

  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rows: true } } },
  });

  if (batches.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-medium">Import report</h1>
        <p className="mt-2 text-sm text-muted-foreground">No imports have run yet.</p>
      </div>
    );
  }

  const activeBatchId = batch && batches.some((b) => b.id === batch) ? batch : batches[0].id;

  const rows = await prisma.importLogRow.findMany({
    where: { batchId: activeBatchId },
    orderBy: { createdAt: "asc" },
  });

  const accepted = rows.filter((r) => r.status === "ACCEPTED").length;
  const merged = rows.filter((r) => r.status === "MERGED").length;
  const rejected = rows.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">Import report</h1>
          <p className="text-sm text-muted-foreground">
            {accepted} accepted · {merged} merged · {rejected} rejected
          </p>
        </div>
        <BatchSelect
          activeBatchId={activeBatchId}
          batches={batches.map((b) => ({
            id: b.id,
            label: `${b.source === "SEED" ? "Seed import" : b.filename ?? "Upload"} — ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(b.createdAt)} (${b._count.rows} rows)`,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-16">Type</TableHead>
              <TableHead className="w-2/5">Row</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Badge variant="outline" className={STATUS_VARIANT[row.status]}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.entityType}</TableCell>
                <TableCell>
                  <code className="block whitespace-pre-wrap break-all text-xs text-muted-foreground">
                    {JSON.stringify(row.rawRow)}
                  </code>
                </TableCell>
                <TableCell className="whitespace-normal text-sm">{row.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
