import { NextResponse } from "next/server";
import { proxyToBackend, requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const res = await proxyToBackend("/stats");
  const data = await res.json();
  return NextResponse.json(data);
}
