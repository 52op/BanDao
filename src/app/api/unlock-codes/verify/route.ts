import { NextResponse, type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/public-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await proxyToBackend("/unlock-codes/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
