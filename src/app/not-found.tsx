import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <LogoMark className="h-9 w-9" />
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Compass className="h-4 w-4" />
          <span className="text-sm">Page not found</span>
        </div>
        <h1 className="font-display text-2xl font-medium">This page isn&apos;t on the schedule.</h1>
        <p className="text-sm text-muted-foreground">
          The link may be old, or the page moved. Let&apos;s get you back.
        </p>
      </div>
      <Button render={<Link href="/" />} nativeButton={false} className="rounded-full">
        Back to Rounds
      </Button>
    </main>
  );
}
