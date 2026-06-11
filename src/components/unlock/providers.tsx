"use client";

import { Toaster } from "@/components/ui/sonner";
import { UnlockProvider } from "./unlock-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UnlockProvider>
      {children}
      <Toaster />
    </UnlockProvider>
  );
}
