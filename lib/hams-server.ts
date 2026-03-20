/**
 * Server-only HAMS base URL and API key (never expose HAMS_API_KEY to the client).
 */

export function getHamsConfig(): { baseUrl: string; apiKey: string; termsVersion: string } {
  const baseUrl = (process.env.HAMS_API_URL || "").replace(/\/$/, "");
  const apiKey = process.env.HAMS_API_KEY || "";
  const rawTerms = (process.env.HAMS_TERMS_VERSION || "1.0").trim().slice(0, 32);
  const termsVersion = rawTerms.length > 0 ? rawTerms : "1.0";

  if (!baseUrl) {
    throw new Error("HAMS_API_URL is not configured");
  }
  if (!apiKey) {
    throw new Error("HAMS_API_KEY is not configured");
  }
  if (!termsVersion) {
    throw new Error("HAMS_TERMS_VERSION must be non-empty");
  }

  return { baseUrl, apiKey, termsVersion };
}

export async function hamsPost<T>(
  path: string,
  body: unknown
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; data: unknown }> {
  const { baseUrl, apiKey } = getHamsConfig();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data };
}
