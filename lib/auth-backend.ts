/**
 * Server-only: call the configured account API base (`ADMINSITE_AUTH_BASE_URL`).
 * Player-facing errors should stay generic; use logs for operator detail.
 */

export function getAuthBackendConfig(): { baseUrl: string } {
  const raw = (process.env.ADMINSITE_AUTH_BASE_URL || "").trim();
  const baseUrl = raw.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("ADMINSITE_AUTH_BASE_URL is not configured");
  }
  return { baseUrl };
}

/** Safe host for logs (no path/query). */
export function authBackendBaseHost(): string {
  try {
    const { baseUrl } = getAuthBackendConfig();
    return new URL(baseUrl).host;
  } catch {
    return "(not-configured)";
  }
}

const DEBUG_AUTH = process.env.REGISTRATION_DEBUG_AUTH === "1";

function logAuthBackend(event: string, payload: Record<string, unknown>) {
  if (DEBUG_AUTH) {
    console.info("[auth-backend]", event, payload);
  }
}

export async function authBackendPost<T>(
  path: "login" | "register",
  body: unknown
): Promise<
  { ok: true; status: number; data: T } | { ok: false; status: number; data: unknown }
> {
  const { baseUrl } = getAuthBackendConfig();
  const url = `${baseUrl}/api/auth/${path}`;
  let host: string;
  try {
    host = new URL(baseUrl).host;
  } catch {
    host = "(invalid-base-url)";
  }

  logAuthBackend("fetch_start", { path, host });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth-backend] fetch threw", { path, host, message: msg });
    throw e;
  }

  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  const text = await res.text();
  let data: unknown = {};
  if (text.length > 0) {
    if (ct.includes("json") || text.trimStart().startsWith("{")) {
      try {
        data = JSON.parse(text) as unknown;
      } catch (parseErr) {
        console.error("[auth-backend] JSON parse failed", {
          path,
          host,
          status: res.status,
          contentType: ct,
          bodyLength: text.length,
          bodyPreview: text.slice(0, 200),
        });
        data = {
          error: "The account service returned an unexpected response. Please try again.",
          code: "ADMIN_SITE_NON_JSON",
        };
      }
    } else {
      console.error("[auth-backend] non-JSON response", {
        path,
        host,
        status: res.status,
        contentType: ct || "(missing)",
        bodyLength: text.length,
        bodyPreview: text.slice(0, 200),
      });
      data = {
        error: "The account service returned an unexpected response. Please try again.",
        code: "ADMIN_SITE_NON_JSON",
      };
    }
  }

  const keys =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.keys(data as object).slice(0, 24)
      : [];

  logAuthBackend("fetch_done", {
    path,
    host,
    status: res.status,
    ok: res.ok,
    contentType: ct || null,
    bodyLength: text.length,
    dataKeys: keys,
  });

  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data: data as T };
}

export async function authBackendForgotPassword(
  email: string
): Promise<
  { ok: true; status: number; data: { message?: string } } | { ok: false; status: number; data: unknown }
> {
  const { baseUrl } = getAuthBackendConfig();
  const url = `${baseUrl}/api/auth/forgot-password`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (e) {
    console.error("[auth-backend] forgot-password fetch failed", e);
    return {
      ok: false,
      status: 502,
      data: { error: "Could not reach the account service." },
    };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data: data as { message?: string } };
}

export async function authBackendResetPassword(
  token: string,
  newPassword: string
): Promise<
  { ok: true; status: number; data: { message?: string } } | { ok: false; status: number; data: unknown }
> {
  const { baseUrl } = getAuthBackendConfig();
  const url = `${baseUrl}/api/auth/reset-password`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  } catch (e) {
    console.error("[auth-backend] reset-password fetch failed", e);
    return {
      ok: false,
      status: 502,
      data: { error: "Could not reach the account service." },
    };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return { ok: true, status: res.status, data: data as { message?: string } };
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
        error:
          "We couldn't reach the account service. Please check your connection and try again.",
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
        error: "The account service returned an unexpected response. Please try again.",
        code: "ADMIN_SITE_BAD_RESPONSE",
      };
    }
  }

  if (!res.ok) {
    const err = data as MarkVerifiedErr;
    if (!err.error) {
      err.error =
        res.status === 503
          ? "Email verification is temporarily unavailable. Please try again in a few minutes."
          : "We couldn't complete email verification. Please try again.";
    }
    return {
      ok: false,
      status: res.status,
      data: err,
    };
  }
  return { ok: true, status: res.status, data: data as MarkVerifiedOk };
}
