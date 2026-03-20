import { NextResponse } from "next/server";
import { EMAIL_VERIFY_COOKIE } from "@/lib/email-verify-session";

export const ACCESS_COOKIE = "ho_access_token";
export const REFRESH_COOKIE = "ho_refresh_token";

export type LoginTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  account_id: string;
};

/**
 * Sets httpOnly auth cookies and returns a JSON body safe for the browser (no tokens).
 */
function safeCookieMaxAge(seconds: number, fallback: number): number {
  const n = Math.floor(Number(seconds));
  if (!Number.isFinite(n) || n < 60) return fallback;
  if (n > 60 * 60 * 24 * 400) return 60 * 60 * 24 * 400; /* cap ~400d */
  return n;
}

export function jsonWithAuthCookies(
  data: LoginTokens,
  keepMeSignedIn: boolean
): NextResponse {
  const accessTok =
    typeof data.access_token === "string" ? data.access_token.trim() : "";
  const refreshTok =
    typeof data.refresh_token === "string" ? data.refresh_token.trim() : "";
  const accountId =
    typeof data.account_id === "string" ? data.account_id.trim() : "";
  if (!accessTok || !refreshTok) {
    throw new Error("LOGIN_RESPONSE_MISSING_TOKENS");
  }
  if (!accountId) {
    throw new Error("LOGIN_RESPONSE_MISSING_ACCOUNT_ID");
  }

  const accessMaxAge = safeCookieMaxAge(Number(data.expires_in), 900);
  const refreshMaxAge = keepMeSignedIn
    ? 60 * 60 * 24 * 30
    : 60 * 60 * 24 * 7;

  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({
    ok: true as const,
    account_id: accountId,
    token_type: data.token_type ?? "Bearer",
  });

  res.cookies.set(ACCESS_COOKIE, accessTok, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  res.cookies.set(REFRESH_COOKIE, refreshTok, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });

  return res;
}

export function clearEmailVerifyCookie(res: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(EMAIL_VERIFY_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
