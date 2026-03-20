import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";

type LoginOk = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  account_id: string;
};

type LoginErr = { error?: string; code?: string };

const ACCESS_COOKIE = "ho_access_token";
const REFRESH_COOKIE = "ho_refresh_token";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; keepMeSignedIn?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const keepMeSignedIn = Boolean(body.keepMeSignedIn);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    getAuthBackendConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[auth/login]", msg);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  let result: Awaited<ReturnType<typeof authBackendPost<LoginOk | LoginErr>>>;
  try {
    result = await authBackendPost<LoginOk | LoginErr>("login", {
      email,
      password,
    });
  } catch (e) {
    console.error("[auth/login] AdminSite auth request failed", e);
    return NextResponse.json(
      { error: "Could not reach authentication service" },
      { status: 502 }
    );
  }

  if (!result.ok) {
    const err = result.data as LoginErr;
    return NextResponse.json(
      {
        error: err.error || "Sign in failed",
        code: err.code,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const data = result.data as LoginOk;
  const accessMaxAge = Math.max(60, Number(data.expires_in) || 900);
  // Refresh token lifetime on HAMS is typically ~7d; keep cookie aligned with "remember me"
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
