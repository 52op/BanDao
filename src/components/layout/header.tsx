"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header({ isHome }: { isHome?: boolean }) {
  if (isHome) {
    return (
      <header className="flex items-center justify-between h-14 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-7 rounded-md bg-foreground text-background text-[11px] font-bold font-mono">
            B
          </span>
          <span className="font-heading text-base">办到</span>
        </Link>
        <div className="flex items-center gap-5 text-xs text-muted-foreground/60">
          <span className="hidden sm:inline">纯前端 · 完全免费</span>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center h-14 px-4 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0 lg:hidden">
      <Sheet>
        <SheetTrigger className="inline-flex items-center justify-center size-8 shrink-0 rounded-md hover:bg-muted transition-colors">
          <Menu className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-52">
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <Link href="/" className="ml-3 flex items-center gap-2">
        <span className="flex items-center justify-center size-5.5 rounded bg-foreground text-background text-[9px] font-bold font-mono">
          B
        </span>
        <span className="font-heading text-sm">办到</span>
      </Link>
    </header>
  );
}
