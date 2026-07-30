import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="font-display text-xl font-medium tracking-tight">Rounds</span>
        </Link>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-medium">Sign in</CardTitle>
            <CardDescription>Use the credentials from your clinic&apos;s README.</CardDescription>
          </CardHeader>
          <CardContent>
            {params.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Wrong email or password. Try again.</AlertDescription>
              </Alert>
            )}
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? ""} />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@clinicmail.test" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
