"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleSSOLogin = () => {
    const ssoUrl = process.env.NEXT_PUBLIC_GOAUTH_URL || "https://auth.it0731.cn";
    const callbackUrl = `${window.location.origin}/api/auth/sso/callback`;
    const loginUrl = `${ssoUrl}/login?redirect=${encodeURIComponent(callbackUrl)}`;
    setLoading(true);
    window.location.href = loginUrl;
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center size-12 rounded-xl bg-foreground text-background text-lg font-bold font-mono mx-auto mb-4">
          B
        </div>
        <h1 className="font-heading text-2xl font-bold">登录办到</h1>
        <p className="text-sm text-muted-foreground mt-2">
          使用统一账号登录，解锁高级功能
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error === "missing_token" && "登录凭证缺失，请重试"}
          {error === "invalid_token" && "登录凭证无效，请重试"}
          {!["missing_token", "invalid_token"].includes(error) && "登录失败，请重试"}
        </div>
      )}

      <Button
        onClick={handleSSOLogin}
        disabled={loading}
        className="w-full h-11"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            跳转中...
          </>
        ) : (
          "使用统一账号登录"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground/50">
        没有账号？访问{" "}
        <a
          href={`${process.env.NEXT_PUBLIC_GOAUTH_URL || "https://auth.it0731.cn"}/register`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground/60"
        >
          统一登录中心
        </a>{" "}
        注册
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
