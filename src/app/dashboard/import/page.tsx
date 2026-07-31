import { Upload } from "lucide-react";
import { requireManager } from "@/lib/auth-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { uploadShiftsCsvAction, uploadStaffCsvAction } from "./actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireManager();
  const params = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Import CSV</h1>
        <p className="text-sm text-muted-foreground">
          Uses the same normalization and validation logic as the initial seed import. Every row
          shows up on the{" "}
          <a href="/dashboard/import/report" className="underline">
            import report
          </a>
          , whether accepted, merged, or rejected.
        </p>
      </div>

      {params.error && (
        <Alert variant="destructive">
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium">Staff roster</CardTitle>
          <CardDescription>Columns: staff_id, full_name, role, email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadStaffCsvAction} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="staff-file">CSV file</Label>
              <Input id="staff-file" name="file" type="file" accept=".csv,text/csv" required />
            </div>
            <SubmitButton pendingLabel="Importing">
              <Upload className="h-4 w-4" /> Import
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg font-medium">Shifts</CardTitle>
          <CardDescription>Columns: shift_id, date, start_time, end_time, requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadShiftsCsvAction} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="shifts-file">CSV file</Label>
              <Input id="shifts-file" name="file" type="file" accept=".csv,text/csv" required />
            </div>
            <SubmitButton pendingLabel="Importing">
              <Upload className="h-4 w-4" /> Import
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
