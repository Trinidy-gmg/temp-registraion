import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  type LoginTokens,
} from "@/lib/auth-session-cookies";

function safeCookieMaxAge(seconds: number, fallback: number): number {
  const n = Math.floor(Number(seconds));
  if (!Number.isFinite(n) || n < 60) return fallback;
  if (n > 60 * 60 * 24 * 400) return 60 * 60 * 24 * 400;
  return n;
}

const MAX_COOKIE_VALUE_LEN = 4090;

/**
 * Persists HAMS tokens in httpOnly cookies after a successful credentials login.
 * Used by NextAuth authorize() so /api/oauth/* can forward Bearer to HAMS.
 */
export async function setHamsAuthCookiesFromLogin(
  tokens: LoginTokens,
  keepMeSignedIn: boolean
): Promise<void> {
  const accessTok = tokens.access_token.trim();
  const refreshTok = tokens.refresh_token.trim();
  if (!accessTok || !refreshTok) {
    throw new Error("LOGIN_RESPONSE_MISSING_TOKENS");
  }
  if (
    accessTok.length > MAX_COOKIE_VALUE_LEN ||
    refreshTok.length > MAX_COOKIE_VALUE_LEN
  ) {
    throw new Error(
      `LOGIN_TOKEN_COOKIE_TOO_LARGE:access=${accessTok.length},refresh=${refreshTok.length}`
    );
  }

  const accessMaxAge = safeCookieMaxAge(Number(tokens.expires_in), 900);
  const refreshMaxAge = keepMeSignedIn
    ? 60 * 60 * 24 * 30
    : 60 * 60 * 24 * 7;

  const secure = process.env.NODE_ENV === "production";
  const store = await cookies();

  store.set(ACCESS_COOKIE, accessTok, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });
  store.set(REFRESH_COOKIE, refreshTok, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });
}

export async function clearHamsAuthCookies(): Promise<void> {
  const secure = process.env.NODE_ENV === "production";
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  store.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readHamsAccessTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(ACCESS_COOKIE)?.value;
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}
