import { type NextRequest, NextResponse } from "next/server";
import {
  verifySSOToken,
  syncSSOUser,
  setSessionCookie,
  type SessionUser,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/";

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  // 1. 验证 RS256 JWT
  const claims = await verifySSOToken(token);
  if (!claims) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  // 2. 同步用户到 Go 后端
  const syncResult = await syncSSOUser(claims);

  // 3. 构建 session 用户
  const user: SessionUser = {
    id: claims.user_id,
    email: claims.email || "",
    name: claims.username || claims.email || "",
    role: syncResult?.role || "user",
    avatar_url: claims.avatar_url,
  };

  // 4. 设置 session cookie 并重定向
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.headers.append("Set-Cookie", setSessionCookie(user));
  return response;
}
