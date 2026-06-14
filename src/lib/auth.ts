import { jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "bandao_session";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export interface SSOClaims extends JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

// 验证 GoAuth RS256 JWT
export async function verifySSOToken(token: string): Promise<SSOClaims | null> {
  const publicKeyPem = process.env.GOAUTH_PUBLIC_KEY;
  if (!publicKeyPem) return null;

  try {
    // 将 PEM 公钥转换为 Uint8Array
    const pem = publicKeyPem
      .replace(/\\n/g, "\n")
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s/g, "");

    const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

    const { payload } = await jwtVerify(token, binaryDer, {
      algorithms: ["RS256"],
      issuer: process.env.GOAUTH_ISSUER || "goauth",
    });

    return payload as SSOClaims;
  } catch {
    return null;
  }
}

// 从 cookie 获取 session
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
    if (!payload?.id) return null;
    return payload as SessionUser;
  } catch {
    return null;
  }
}

// 设置 session cookie
export function setSessionCookie(user: SessionUser): string {
  const payload = JSON.stringify(user);
  const encoded = Buffer.from(payload).toString("base64");
  return `${SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

// 清除 session cookie
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// 同步 SSO 用户到 Go 后端
export async function syncSSOUser(claims: SSOClaims): Promise<{ role: string; is_unlocked: boolean } | null> {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8080";
  const internalSecret = process.env.INTERNAL_SECRET || "";

  try {
    const res = await fetch(`${backendUrl}/internal/users/sso-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        user_id: claims.user_id,
        email: claims.email || "",
        name: claims.username || claims.email || "",
        avatar_url: claims.avatar_url || "",
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}
