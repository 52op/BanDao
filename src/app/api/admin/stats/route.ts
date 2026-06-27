import { type NextRequest, NextResponse } from "next/server";
import { proxyToBackend, requireAdmin } from "@/lib/admin-api";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const res = await proxyToBackend("/stats", {}, admin);
  const data = await res.json();
  return NextResponse.json(data);
}
