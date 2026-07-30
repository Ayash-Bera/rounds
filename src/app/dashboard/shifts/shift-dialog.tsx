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
import { formatDateInput } from "@/lib/format";
import { createShiftAction, updateShiftAction } from "./actions";

type ShiftDialogProps = {
  mode: "create" | "edit";
  shift?: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    requirements: { DOCTOR: number; NURSE: number; RECEPTIONIST: number };
  };
  trigger: ReactElement;
};

export function ShiftDialog({ mode, shift, trigger }: ShiftDialogProps) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createShiftAction : updateShiftAction;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{mode === "create" ? "New shift" : "Edit shift"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Existing claims are re-checked against these rules after saving."
              : "Set the date, time, and how many of each role are needed."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {shift && <input type="hidden" name="shiftId" value={shift.id} />}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-2">
              <Label htmlFor={`date-${mode}`}>Date</Label>
              <Input
                id={`date-${mode}`}
                name="date"
                type="date"
                defaultValue={shift ? formatDateInput(shift.date) : undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`startTime-${mode}`}>Start</Label>
              <Input id={`startTime-${mode}`} name="startTime" type="time" defaultValue={shift?.startTime} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`endTime-${mode}`}>End</Label>
              <Input id={`endTime-${mode}`} name="endTime" type="time" defaultValue={shift?.endTime} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`req_doctor-${mode}`}>Doctors</Label>
              <Input
                id={`req_doctor-${mode}`}
                name="req_doctor"
                type="number"
                min={0}
                defaultValue={shift?.requirements.DOCTOR ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`req_nurse-${mode}`}>Nurses</Label>
              <Input
                id={`req_nurse-${mode}`}
                name="req_nurse"
                type="number"
                min={0}
                defaultValue={shift?.requirements.NURSE ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`req_receptionist-${mode}`}>Receptionists</Label>
              <Input
                id={`req_receptionist-${mode}`}
                name="req_receptionist"
                type="number"
                min={0}
                defaultValue={shift?.requirements.RECEPTIONIST ?? 0}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-full">
              {mode === "create" ? "Create shift" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
