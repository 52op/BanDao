"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex h-screen overflow-hidden">
      {!isHome && <Sidebar className="hidden lg:flex" />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isHome={isHome} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
