import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";
import {
  jsonWithAuthCookies,
  type LoginTokens,
} from "@/lib/auth-session-cookies";

type LoginErr = {
  error?: string;
  code?: string;
  account_id?: string;
};

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

  let result: Awaited<ReturnType<typeof authBackendPost<LoginTokens | LoginErr>>>;
  try {
    result = await authBackendPost<LoginTokens | LoginErr>("login", {
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
        ...(err.code === "EMAIL_NOT_VERIFIED" && err.account_id
          ? { account_id: err.account_id }
          : {}),
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const data = result.data as LoginTokens;
  try {
    return jsonWithAuthCookies(data, keepMeSignedIn);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth/login] session cookies", msg, {
      hasAccess: typeof data?.access_token === "string" && data.access_token.length > 0,
      hasRefresh: typeof data?.refresh_token === "string" && data.refresh_token.length > 0,
      accountId: typeof data?.account_id === "string" ? data.account_id : "(missing)",
    });
    if (
      msg === "LOGIN_RESPONSE_MISSING_TOKENS" ||
      msg === "LOGIN_RESPONSE_MISSING_ACCOUNT_ID"
    ) {
      return NextResponse.json(
        {
          error:
            "Auth service login response was incomplete (tokens or account_id). Check AdminSite → HAMS login JSON.",
          code: "LOGIN_INCOMPLETE",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        error: "Could not set session cookies. Try again.",
        code: "SESSION_COOKIE_ERROR",
        hint: msg.slice(0, 160),
      },
      { status: 500 }
    );
  }
}
