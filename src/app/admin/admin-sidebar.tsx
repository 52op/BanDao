"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Settings,
  Users,
  Key,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/tools", label: "工具管理", icon: Wrench },
  { href: "/admin/categories", label: "分类管理", icon: FolderTree },
  { href: "/admin/settings", label: "站点设置", icon: Settings },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/unlock-codes", label: "解锁码", icon: Key },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-sidebar border-r border-border/50 shrink-0 flex flex-col">
      <div className="px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回前台
        </Link>
        <h1 className="font-heading text-lg font-bold mt-3">后台管理</h1>
      </div>

      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors mb-0.5",
                isActive
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
