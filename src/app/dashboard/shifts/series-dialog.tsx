"use client";

import { useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSeriesAction } from "./actions";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function SeriesDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">New recurring series</DialogTitle>
          <DialogDescription>
            Creates a real shift for every matching day between the two dates. Each occurrence can
            later be edited or deleted on its own without touching the rest of the series.
          </DialogDescription>
        </DialogHeader>
        <form action={createSeriesAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Repeats on</Label>
            <div className="flex flex-wrap gap-4">
              {DAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="daysOfWeek"
                    value={day.value}
                    className="accent-primary h-4 w-4 rounded border-input"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seriesStart">From</Label>
              <Input id="seriesStart" name="seriesStart" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesEnd">Until</Label>
              <Input id="seriesEnd" name="seriesEnd" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="series-startTime">Start time</Label>
              <Input id="series-startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-endTime">End time</Label>
              <Input id="series-endTime" name="endTime" type="time" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="series-req_doctor">Doctors</Label>
              <Input id="series-req_doctor" name="req_doctor" type="number" min={0} defaultValue={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-req_nurse">Nurses</Label>
              <Input id="series-req_nurse" name="req_nurse" type="number" min={0} defaultValue={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-req_receptionist">Receptionists</Label>
              <Input
                id="series-req_receptionist"
                name="req_receptionist"
                type="number"
                min={0}
                defaultValue={0}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-full">
              Create series
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
