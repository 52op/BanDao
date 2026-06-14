"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const SSO_URL = process.env.NEXT_PUBLIC_GOAUTH_URL || "https://auth.it0731.cn";
const TOKEN_KEY = "bandao_token";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检测 ?token= 参数（GoAuth 回调带回来的）
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // 清除 URL 中的 token 参数
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
      router.replace("/");
      return;
    }
    setLoading(false);
  }, [searchParams, router]);

  const handleSSOLogin = () => {
    const callbackUrl = window.location.origin;
    const loginUrl = `${SSO_URL}/login?redirect=${encodeURIComponent(callbackUrl)}`;
    window.location.href = loginUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      <Button
        onClick={handleSSOLogin}
        className="w-full h-11"
        size="lg"
      >
        使用统一账号登录
      </Button>

      <p className="text-center text-xs text-muted-foreground/50">
        没有账号？访问{" "}
        <a
          href={`${SSO_URL}/register`}
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
