"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <LogoMark className="h-9 w-9" />
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-status-empty">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Something went wrong</span>
        </div>
        <h1 className="font-display text-2xl font-medium">That request didn&apos;t go through.</h1>
        <p className="text-sm text-muted-foreground">
          Nothing was saved. Try again, and if it keeps happening let your manager know.
        </p>
      </div>
      <Button onClick={reset} className="rounded-full">
        Try again
      </Button>
    </main>
  );
}
