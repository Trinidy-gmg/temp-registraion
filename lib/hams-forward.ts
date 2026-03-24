/**
 * Server-only HAMS calls (OAuth linking, etc.). Uses HAMS_API_URL + HAMS_API_KEY.
 * Player access token is supplied per request (httpOnly cookie), never exposed in HTML.
 */

export function getHamsApiConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = (process.env.HAMS_API_URL || "")
    .trim()
    .replace(/\/$/, "");
  const apiKey = (process.env.HAMS_API_KEY || "").trim();

  if (!baseUrl) {
    throw new Error("HAMS_API_URL is not configured");
  }
  if (!apiKey) {
    throw new Error("HAMS_API_KEY is not configured");
  }

  return { baseUrl, apiKey };
}

export async function hamsFetchJson(
  path: string,
  opts: {
    accessToken: string;
    method?: string;
    body?: BodyInit | null;
    headers?: HeadersInit;
  }
): Promise<{ status: number; data: unknown; ok: boolean }> {
  const { baseUrl, apiKey } = getHamsApiConfig();
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${p}`;

  const headers = new Headers(opts.headers);
  headers.set("X-API-Key", apiKey);
  headers.set("Authorization", `Bearer ${opts.accessToken}`);

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    body: opts.body ?? null,
    headers,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}
