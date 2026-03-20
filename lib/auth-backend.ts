/**
 * Server-only: call AdminSite public auth routes (demo).
 * HAMS credentials stay on AdminSite; RegistrationPage only needs ADMINSITE_AUTH_BASE_URL.
 */

export function getAuthBackendConfig(): { baseUrl: string } {
  const raw = (process.env.ADMINSITE_AUTH_BASE_URL || "").trim();
  const baseUrl = raw.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("ADMINSITE_AUTH_BASE_URL is not configured");
  }
  return { baseUrl };
}

export async function authBackendPost<T>(
  path: "login" | "register",
  body: unknown
): Promise<
  { ok: true; status: number; data: T } | { ok: false; status: number; data: unknown }
> {
  const { baseUrl } = getAuthBackendConfig();
  const url = `${baseUrl}/api/auth/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as T;

  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data };
}
