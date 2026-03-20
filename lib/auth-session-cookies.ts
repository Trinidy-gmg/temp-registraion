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
export function jsonWithAuthCookies(
  data: LoginTokens,
  keepMeSignedIn: boolean
): NextResponse {
  const accessMaxAge = Math.max(60, Number(data.expires_in) || 900);
  const refreshMaxAge = keepMeSignedIn
    ? 60 * 60 * 24 * 30
    : 60 * 60 * 24 * 7;

  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({
    ok: true as const,
    account_id: data.account_id,
    token_type: data.token_type,
  });

  res.cookies.set(ACCESS_COOKIE, data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  res.cookies.set(REFRESH_COOKIE, data.refresh_token, {
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
