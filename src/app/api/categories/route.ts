import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/public-api";

export async function GET() {
  const res = await proxyToBackend("/categories");
  const data = await res.json();
  return NextResponse.json(data);
}
