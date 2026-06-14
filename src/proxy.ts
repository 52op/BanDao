import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "bandao_session";

function getSessionUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
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
