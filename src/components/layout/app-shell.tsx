"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandMenu } from "@/components/command-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isHome && !isAdmin && <Sidebar className="hidden lg:flex" />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isHome={isHome} onSearch={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
