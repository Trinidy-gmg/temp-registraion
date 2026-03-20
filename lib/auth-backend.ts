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

type MarkVerifiedOk = {
  message?: string;
  account_id?: string;
  email_verified?: boolean;
};
type MarkVerifiedErr = { error?: string; code?: string };

/**
 * Marks email verified on HAMS via AdminSite (API key stays on AdminSite).
 * Optional REGISTRATION_VERIFY_SECRET must match AdminSite when that service enforces it.
 */
export async function authBackendMarkEmailVerified(
  accountId: string
): Promise<
  | { ok: true; status: number; data: MarkVerifiedOk }
  | { ok: false; status: number; data: MarkVerifiedErr }
> {
  const { baseUrl } = getAuthBackendConfig();
  const secret = (process.env.REGISTRATION_VERIFY_SECRET || "").trim();
  const url = `${baseUrl}/api/auth/mark-email-verified`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Registration-Verify-Secret"] = secret;
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth-backend] REGISTRATION_VERIFY_SECRET is empty; AdminSite production mark-email-verified will return 503."
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ account_id: accountId }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth-backend] mark-email-verified fetch failed", msg);
    return {
      ok: false,
      status: 502,
      data: {
        error: `Could not reach AdminSite (${baseUrl}): ${msg}. Check ADMINSITE_AUTH_BASE_URL, DNS/TLS, and that the host allows requests from Vercel.`,
        code: "ADMIN_SITE_UNREACHABLE",
      },
    };
  }

  const rawText = await res.text();
  let data = {} as MarkVerifiedOk | MarkVerifiedErr;
  if (rawText) {
    try {
      data = JSON.parse(rawText) as MarkVerifiedOk | MarkVerifiedErr;
    } catch {
      data = {
        error: `AdminSite returned ${res.status} with non-JSON body: ${rawText.slice(0, 180)}`,
        code: "ADMIN_SITE_BAD_RESPONSE",
      };
    }
  }

  if (!res.ok) {
    const err = data as MarkVerifiedErr;
    if (!err.error) {
      err.error =
        res.status === 503
          ? "AdminSite returned 503 (often: REGISTRATION_VERIFY_SECRET or HAMS_API_URL/HAMS_API_KEY missing on AdminSite in production — set env and redeploy AdminSite)."
          : `AdminSite mark-email-verified failed (${res.status}).`;
    }
    return {
      ok: false,
      status: res.status,
      data: err,
    };
  }
  return { ok: true, status: res.status, data: data as MarkVerifiedOk };
}
