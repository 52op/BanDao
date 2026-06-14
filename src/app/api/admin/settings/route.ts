import { type NextRequest, NextResponse } from "next/server";
import { proxyToBackend, requireAdmin } from "@/lib/admin-api";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const res = await proxyToBackend("/settings");
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const res = await proxyToBackend("/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
