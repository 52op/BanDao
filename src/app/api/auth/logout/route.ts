import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ code: 0, message: "ok" });
  response.headers.append("Set-Cookie", clearSessionCookie());
  return response;
}
