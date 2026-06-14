import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 将 token 传递给前端，由前端存入 localStorage
  return NextResponse.redirect(
    new URL(`/?token=${token}`, request.url)
  );
}
