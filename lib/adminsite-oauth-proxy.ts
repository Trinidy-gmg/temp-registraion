/**
 * Server-only: Discord / OAuth player calls go through AdminSite (HTTPS),
 * which forwards to internal HAMS. Uses ADMINSITE_AUTH_BASE_URL +
 * REGISTRATION_VERIFY_SECRET (same as mark-email-verified).
 */

import { getAuthBackendConfig } from "@/lib/auth-backend";

const PROXY_PREFIX = "/api/registration/hams-oauth";

function getRegistrationVerifySecret(): string {
  return (process.env.REGISTRATION_VERIFY_SECRET || "").trim();
}

export function getOAuthProxyConfig(): { baseUrl: string; secret: string } {
  const { baseUrl } = getAuthBackendConfig();
  const secret = getRegistrationVerifySecret();
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "REGISTRATION_VERIFY_SECRET is not configured (required in production for AdminSite OAuth proxy)"
    );
  }
  return { baseUrl, secret };
}

/**
 * @param relativePath - path under `/api/registration/hams-oauth`, e.g. `/discord/initiate`, `/links`
 */
export async function oauthProxyFetchJson(
  relativePath: string,
  opts: {
    accessToken: string;
    method?: string;
    body?: BodyInit | null;
    headers?: HeadersInit;
  }
): Promise<{ status: number; data: unknown; ok: boolean }> {
  const { baseUrl, secret } = getOAuthProxyConfig();
  const rel = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const url = `${baseUrl}${PROXY_PREFIX}${rel}`;

  const headers = new Headers(opts.headers);
  headers.set("Authorization", `Bearer ${opts.accessToken}`);
  if (secret) {
    headers.set("X-Registration-Verify-Secret", secret);
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    body: opts.body ?? null,
    headers,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}
