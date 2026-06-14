import { NextResponse, type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/public-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const res = await proxyToBackend(`/tools/${slug}`);
  const data = await res.json();
  return NextResponse.json(data);
}
