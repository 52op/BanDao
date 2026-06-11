"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/tools/registry";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-56 bg-sidebar text-sidebar-foreground border-r border-border/50 shrink-0",
        className
      )}
    >
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-7 rounded-lg bg-foreground text-background text-xs font-bold font-mono">
            B
          </span>
          <span className="font-semibold text-base">办到</span>
        </Link>
      </div>

      <Separator className="opacity-40" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {tools.map((tool) => {
            const href = `/tools/${tool.slug}`;
            const isActive = pathname === href;
            const Icon = tool.icon;
            return (
              <li key={tool.slug}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-60" />
                  {tool.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5 py-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground/50 leading-relaxed">
          关注公众号获取高级功能
        </p>
      </div>
    </aside>
  );
}
