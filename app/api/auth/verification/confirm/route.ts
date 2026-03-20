import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authBackendMarkEmailVerified,
  authBackendPost,
  getAuthBackendConfig,
} from "@/lib/auth-backend";
import {
  clearEmailVerifyCookie,
  jsonWithAuthCookies,
  type LoginTokens,
} from "@/lib/auth-session-cookies";
import {
  EMAIL_VERIFY_COOKIE,
  codeMatchesPayload,
  openEmailVerifyToken,
} from "@/lib/email-verify-session";
type LoginErr = { error?: string; code?: string };

/**
 * Verifies the 8-digit code, marks email verified on HAMS, then signs the user in.
 */
export async function POST(request: Request) {
  let body: { code?: string; password?: string; keepMeSignedIn?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const codeRaw = typeof body.code === "string" ? body.code : "";
  const password = typeof body.password === "string" ? body.password : "";
  const keepMeSignedIn = Boolean(body.keepMeSignedIn);

  const code = codeRaw.replace(/\s/g, "");
  if (!/^\d{8}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter the 8-digit code from your email" },
      { status: 400 }
    );
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const jar = await cookies();
  const raw = jar.get(EMAIL_VERIFY_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json(
      { error: "No pending verification session" },
      { status: 400 }
    );
  }

  const payload = openEmailVerifyToken(raw);
  if (!payload) {
    return NextResponse.json(
      { error: "Verification session expired or invalid" },
      { status: 400 }
    );
  }

  if (!codeMatchesPayload(payload, code)) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  try {
    getAuthBackendConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[verification/confirm]", msg);
    return NextResponse.json(
      {
        error:
          msg === "ADMINSITE_AUTH_BASE_URL is not configured"
            ? "RegistrationPage: set ADMINSITE_AUTH_BASE_URL (server env)."
            : "Server configuration error",
        code:
          msg === "ADMINSITE_AUTH_BASE_URL is not configured"
            ? "AUTH_BACKEND_NOT_CONFIGURED"
            : undefined,
      },
      { status: 503 }
    );
  }

  const marked = await authBackendMarkEmailVerified(payload.aid);
  if (!marked.ok) {
    const err = marked.data as LoginErr;
    return NextResponse.json(
      {
        error: err.error || "Could not verify account",
        code: err.code,
      },
      { status: marked.status >= 400 && marked.status < 600 ? marked.status : 502 }
    );
  }

  let loginResult: Awaited<ReturnType<typeof authBackendPost<LoginTokens | LoginErr>>>;
  try {
    loginResult = await authBackendPost<LoginTokens | LoginErr>("login", {
      email: payload.email,
      password,
    });
  } catch (e) {
    console.error("[verification/confirm] login after verify failed", e);
    return NextResponse.json(
      { error: "Could not reach authentication service" },
      { status: 502 }
    );
  }

  if (!loginResult.ok) {
    const err = loginResult.data as LoginErr;
    return NextResponse.json(
      {
        error:
          err.error ||
          "Email was verified but sign-in failed. Try signing in from the home page.",
        code: err.code,
      },
      { status: loginResult.status >= 400 && loginResult.status < 600 ? loginResult.status : 502 }
    );
  }

  const tokens = loginResult.data as LoginTokens;
  try {
    const res = jsonWithAuthCookies(tokens, keepMeSignedIn);
    clearEmailVerifyCookie(res);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[verification/confirm] session cookies", msg, {
      hasAccess: typeof tokens?.access_token === "string" && tokens.access_token.length > 0,
      hasRefresh: typeof tokens?.refresh_token === "string" && tokens.refresh_token.length > 0,
      accountId: typeof tokens?.account_id === "string" ? tokens.account_id : "(missing)",
      keys:
        tokens && typeof tokens === "object"
          ? Object.keys(tokens as object).join(",")
          : "",
    });
    if (
      msg === "LOGIN_RESPONSE_MISSING_TOKENS" ||
      msg === "LOGIN_RESPONSE_MISSING_ACCOUNT_ID"
    ) {
      return NextResponse.json(
        {
          error:
            "Email was verified, but the auth service login response was incomplete (tokens or account_id). Check AdminSite → HAMS login JSON.",
          code: "LOGIN_INCOMPLETE",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        error: "Could not complete sign-in (session). Try again or sign in from the home page.",
        code: "SESSION_COOKIE_ERROR",
      },
      { status: 500 }
    );
  }
}
