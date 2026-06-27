const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: string;
  exp?: number;
  iss?: string;
}

// 简单 JWT 解码（不验证签名，签名验证由 GoAuth 负责）
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1];
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// 从 request 中提取 token（Authorization header）
function extractToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

// 验证 admin 权限
export function requireAdmin(request: Request): JWTPayload | null {
  const token = extractToken(request);
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

// 代理请求到 Go 后端 internal API
export async function proxyToBackend(
  path: string,
  options: RequestInit = {},
  admin?: JWTPayload
): Promise<Response> {
  const url = `${BACKEND_URL}/internal${path}`;
  const headers = new Headers(options.headers);
  headers.set("X-Internal-Secret", INTERNAL_SECRET);
  if (admin) {
    headers.set("X-User-Role", admin.role);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
