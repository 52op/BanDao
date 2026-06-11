"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface HeaderProps {
  isHome?: boolean;
  onSearch?: () => void;
}

export function Header({ isHome, onSearch }: HeaderProps) {
  if (isHome) {
    return (
      <header className="flex items-center justify-between h-14 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-7 rounded-md bg-foreground text-background text-[11px] font-bold font-mono">
            B
          </span>
          <span className="font-heading text-base">办到</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={onSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground/60 hover:border-foreground/20 hover:text-foreground/60 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">搜索</span>
            <kbd className="hidden sm:inline text-[10px] bg-muted/50 px-1 py-0.5 rounded">
              Ctrl+K
            </kbd>
          </button>
          <span className="hidden sm:inline text-xs text-muted-foreground/60">
            纯前端 · 完全免费
          </span>
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

      <button
        onClick={onSearch}
        className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground/60 hover:text-foreground/60 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
