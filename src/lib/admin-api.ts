import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

// 代理请求到 Go 后端 internal API
export async function proxyToBackend(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BACKEND_URL}/internal${path}`;
  const headers = new Headers(options.headers);
  headers.set("X-Internal-Secret", INTERNAL_SECRET);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

// 验证 admin session
export async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
