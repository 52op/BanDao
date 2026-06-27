import { type NextRequest, NextResponse } from "next/server";
import { proxyToBackend, requireAdmin } from "@/lib/admin-api";

export async function GET(request: Request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const res = await proxyToBackend("/unlock-codes", {}, admin);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const res = await proxyToBackend("/unlock-codes", {
    method: "POST",
    body: JSON.stringify(body),
  }, admin);
  const data = await res.json();
  return NextResponse.json(data);
}
