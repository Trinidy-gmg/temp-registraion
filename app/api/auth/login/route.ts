import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";
import {
  coerceLoginTokens,
  jsonWithAuthCookies,
} from "@/lib/auth-session-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginErr = {
  error?: string;
  code?: string;
  account_id?: string;
};

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        {
          error:
            msg === "ADMINSITE_AUTH_BASE_URL is not configured"
              ? "Set ADMINSITE_AUTH_BASE_URL on this Vercel project (public AdminSite origin, no trailing slash)."
              : "Server configuration error",
          code:
            msg === "ADMINSITE_AUTH_BASE_URL is not configured"
              ? "AUTH_BACKEND_NOT_CONFIGURED"
              : undefined,
        },
        { status: 503 }
      );
    }

    let result: Awaited<
      ReturnType<typeof authBackendPost<Record<string, unknown> | LoginErr>>
    >;
    try {
      result = await authBackendPost<Record<string, unknown> | LoginErr>(
        "login",
        {
          email,
          password,
        }
      );
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
        {
          status:
            result.status >= 400 && result.status < 600 ? result.status : 502,
        }
      );
    }

    const coerced = coerceLoginTokens(result.data);
    if (!coerced.ok) {
      console.error("[auth/login] unexpected login JSON shape", {
        reason: coerced.reason,
        keys: coerced.keys,
      });
      return NextResponse.json(
        {
          error:
            "Auth service returned success but the login payload did not include access_token, refresh_token, and account_id (or camelCase equivalents). Check AdminSite → HAMS POST /login response.",
          code: "LOGIN_INCOMPLETE",
          reason: coerced.reason,
          keys: coerced.keys,
        },
        { status: 502 }
      );
    }

    try {
      return jsonWithAuthCookies(coerced.tokens, keepMeSignedIn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth/login] session cookies", msg);
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
      if (msg.startsWith("LOGIN_TOKEN_COOKIE_TOO_LARGE")) {
        return NextResponse.json(
          {
            error:
              "Access or refresh token is too large for a browser cookie (~4KB limit). Shorten JWT claims in HAMS or use a different session strategy.",
            code: "LOGIN_TOKEN_TOO_LARGE",
            hint: msg.slice(0, 200),
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        {
          error: "Could not set session cookies. Try again.",
          code: "SESSION_COOKIE_ERROR",
          hint: msg.slice(0, 200),
        },
        { status: 500 }
      );
    }
  } catch (fatal: unknown) {
    const msg = fatal instanceof Error ? fatal.message : String(fatal);
    console.error("[auth/login] FATAL", fatal);
    return NextResponse.json(
      {
        error: "Sign-in failed unexpectedly. Check Vercel function logs for [auth/login].",
        code: "LOGIN_FATAL",
        hint: msg.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
