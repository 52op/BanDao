import { type NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const res = await fetch(`${BACKEND_URL}/internal/convert/format`, {
    method: "POST",
    headers: {
      "X-Internal-Secret": INTERNAL_SECRET,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, { status: res.status });
  }

  const blob = await res.blob();
  const contentDisposition = res.headers.get("Content-Disposition");

  return new Response(blob, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
      ...(contentDisposition ? { "Content-Disposition": contentDisposition } : {}),
    },
  });
}
