"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { md5 } from "@/lib/md5";

const SSO_URL = process.env.NEXT_PUBLIC_GOAUTH_URL || "https://auth.it0731.cn";

function getAvatarUrl(user: User): string {
  if (user.avatar_url) return user.avatar_url;
  const hash = md5(user.email.trim().toLowerCase());
  return `https://cn.cravatar.com/avatar/${hash}?s=80&d=monsterid`;
}
const TOKEN_KEY = "bandao_token";

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  token?: string;
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSSOToken() {
  return getToken();
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const checkLogin = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    fetch(`${SSO_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const data = json.data;
          setUser(data);
          if (data.token && data.token !== token) {
            setToken(data.token);
          }
        } else {
          clearToken();
          setUser(null);
        }
      })
      .catch(() => {
        clearToken();
        setUser(null);
      });
  }, []);

  useEffect(() => {
    checkLogin();
    // 监听 token 变化（SSO 回调存入 token 后通知）
    const onAuthUpdated = () => checkLogin();
    window.addEventListener("auth-updated", onAuthUpdated);
    return () => window.removeEventListener("auth-updated", onAuthUpdated);
  }, [checkLogin]);

  const handleLogout = useCallback(() => {
    clearToken();
    setUser(null);
    setOpen(false);
    // 跳转 GoAuth 退出，再回调回来
    window.location.href = `${SSO_URL}/logout?redirect=${encodeURIComponent(window.location.origin + "/login")}`;
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
        <img
          src={getAvatarUrl(user)}
          alt=""
          className="size-6 rounded-full object-cover"
        />
        <span className="hidden sm:inline text-sm max-w-24 truncate">
          {user.username || user.email}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-background shadow-lg py-1">
            <div className="px-3 py-2 border-b flex items-center gap-2">
              <img
                src={getAvatarUrl(user)}
                alt=""
                className="size-8 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
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
