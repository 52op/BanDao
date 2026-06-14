import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "bandao_session";

function getSessionUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    // atob 解码为 Latin1 字节串，需 TextDecoder 还原 UTF-8
    const binary = atob(sessionCookie.value);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload?.id) return null;
    return payload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理后台路由保护
  if (pathname.startsWith("/admin")) {
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
