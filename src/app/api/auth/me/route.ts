import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ code: 0, data: user });
}
