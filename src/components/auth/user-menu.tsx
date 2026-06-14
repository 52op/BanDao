"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.code === 0) setUser(json.data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
    window.location.href = "/";
  }, []);

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm" className="text-xs h-8">
          <User className="mr-1.5 h-3.5 w-3.5" />
          登录
        </Button>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {user.name?.[0] || user.email?.[0] || "?"}
          </div>
        )}
        <span className="hidden sm:inline text-sm max-w-24 truncate">
          {user.name || user.email}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-background shadow-lg py-1">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                后台管理
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-muted/50 transition-colors text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}
