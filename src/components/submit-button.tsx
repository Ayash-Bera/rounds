"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant,
  size = "default",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      size={size}
      className={cn("gap-1.5 rounded-full", className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
