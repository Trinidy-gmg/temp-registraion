import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  EMAIL_VERIFY_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/ho-cookie-names";

export { ACCESS_COOKIE, REFRESH_COOKIE };

export type LoginTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  account_id: string;
};

/** Browsers / proxies often cap Set-Cookie around 4KB per cookie. */
const MAX_COOKIE_VALUE_LEN = 4090;

function topLevelKeys(raw: unknown): string[] {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.keys(raw as object).slice(0, 24);
  }
  return [];
}

/**
 * Normalizes AdminSite → HAMS login JSON into LoginTokens.
 * Accepts snake_case or camelCase and optional `{ data: { ... } }` wrappers.
 */
export function coerceLoginTokens(raw: unknown): {
  ok: true;
  tokens: LoginTokens;
} | { ok: false; reason: "not_object" | "missing_tokens"; keys: string[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "not_object", keys: topLevelKeys(raw) };
  }
  const root = raw as Record<string, unknown>;
  let src: Record<string, unknown> = root;
  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    src = root.data as Record<string, unknown>;
  }

  const pickStr = (o: Record<string, unknown>, a: string, b: string) => {
    const x = o[a];
    const y = o[b];
    if (typeof x === "string" && x.trim()) return x.trim();
    if (typeof y === "string" && y.trim()) return y.trim();
    return "";
  };

  const access_token = pickStr(src, "access_token", "accessToken");
  const refresh_token = pickStr(src, "refresh_token", "refreshToken");
  const account_id = pickStr(src, "account_id", "accountId");
  const token_type =
    pickStr(src, "token_type", "tokenType") || "Bearer";
  const expRaw = src.expires_in ?? src.expiresIn;
  let expires_in = 900;
  if (typeof expRaw === "number" && Number.isFinite(expRaw)) {
    expires_in = expRaw;
  } else if (typeof expRaw === "string" && /^\d+$/.test(expRaw)) {
    expires_in = parseInt(expRaw, 10);
  }

  if (!access_token || !refresh_token || !account_id) {
    return {
      ok: false,
      reason: "missing_tokens",
      keys: topLevelKeys(raw),
    };
  }

  return {
    ok: true,
    tokens: {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      account_id,
    },
  };
}

/**
 * Sets httpOnly auth cookies and returns a JSON body safe for the browser (no tokens).
 */
function safeCookieMaxAge(seconds: number, fallback: number): number {
  const n = Math.floor(Number(seconds));
  if (!Number.isFinite(n) || n < 60) return fallback;
  if (n > 60 * 60 * 24 * 400) return 60 * 60 * 24 * 400; /* cap ~400d */
  return n;
}

type AuthCookieFields = {
  accessTok: string;
  refreshTok: string;
  accountId: string;
  accessMaxAge: number;
  refreshMaxAge: number;
  tokenType: string;
};

function assertAuthCookieFields(
  data: LoginTokens,
  keepMeSignedIn: boolean
): AuthCookieFields {
  const accessTok = data.access_token.trim();
  const refreshTok = data.refresh_token.trim();
  const accountId = data.account_id.trim();
  if (!accessTok || !refreshTok) {
    throw new Error("LOGIN_RESPONSE_MISSING_TOKENS");
  }
  if (!accountId) {
    throw new Error("LOGIN_RESPONSE_MISSING_ACCOUNT_ID");
  }
  if (
    accessTok.length > MAX_COOKIE_VALUE_LEN ||
    refreshTok.length > MAX_COOKIE_VALUE_LEN
  ) {
    throw new Error(
      `LOGIN_TOKEN_COOKIE_TOO_LARGE:access=${accessTok.length},refresh=${refreshTok.length}`
    );
  }

  const accessMaxAge = safeCookieMaxAge(Number(data.expires_in), 900);
  const refreshMaxAge = keepMeSignedIn
    ? 60 * 60 * 24 * 30
    : 60 * 60 * 24 * 7;

  return {
    accessTok,
    refreshTok,
    accountId,
    accessMaxAge,
    refreshMaxAge,
    tokenType: data.token_type ?? "Bearer",
  };
}

/**
 * Prefer in Route Handlers on Vercel: `cookies()` from next/headers avoids opaque 500s
 * some deployments hit when using `NextResponse.cookies.set` twice on the same response.
 */
export async function jsonWithAuthCookiesHeaders(
  data: LoginTokens,
  keepMeSignedIn: boolean
): Promise<NextResponse> {
  const f = assertAuthCookieFields(data, keepMeSignedIn);
  const secure = process.env.NODE_ENV === "production";
  const store = await cookies();

  try {
    store.set(ACCESS_COOKIE, f.accessTok, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: f.accessMaxAge,
    });
    store.set(REFRESH_COOKIE, f.refreshTok, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: f.refreshMaxAge,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`COOKIE_STORE_SET_FAILED:${m}`);
  }

  return NextResponse.json({
    ok: true as const,
    account_id: f.accountId,
    token_type: f.tokenType,
  });
}

/** @deprecated Prefer jsonWithAuthCookiesHeaders in Route Handlers (Vercel-safe). */
export function jsonWithAuthCookies(
  data: LoginTokens,
  keepMeSignedIn: boolean
): NextResponse {
  const f = assertAuthCookieFields(data, keepMeSignedIn);
  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({
    ok: true as const,
    account_id: f.accountId,
    token_type: f.tokenType,
  });

  try {
    res.cookies.set(ACCESS_COOKIE, f.accessTok, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: f.accessMaxAge,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`COOKIE_SET_ACCESS_FAILED:${m}`);
  }
  try {
    res.cookies.set(REFRESH_COOKIE, f.refreshTok, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: f.refreshMaxAge,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`COOKIE_SET_REFRESH_FAILED:${m}`);
  }

  return res;
}

/**
 * Best-effort: must not throw. Some Next/Vercel versions error if mixing
 * multiple Set-Cookie ops; callers should still return the auth response if this fails.
 */
export function clearEmailVerifyCookie(res: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  try {
    res.cookies.delete({
      name: EMAIL_VERIFY_COOKIE,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
    });
    return;
  } catch {
    /* continue */
  }
  try {
    res.cookies.set(EMAIL_VERIFY_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {
    /* ignore — verify cookie will expire on its own */
  }
}
