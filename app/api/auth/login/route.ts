import { NextResponse } from "next/server";
import {
  authBackendBaseHost,
  authBackendPost,
  getAuthBackendConfig,
} from "@/lib/auth-backend";
import {
  coerceLoginTokens,
  jsonWithAuthCookies,
} from "@/lib/auth-session-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proves this deployment serves the App Router login route (check Network tab). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/auth/login",
    runtime: "nodejs",
    ts: new Date().toISOString(),
  });
}

const DEBUG_AUTH = process.env.REGISTRATION_DEBUG_AUTH === "1";

/** Log without full email (PII). */
function emailHint(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "(invalid)";
  return `localLen=${at} domain=${email.slice(at + 1)}`;
}

type LoginErr = {
  error?: string;
  code?: string;
  account_id?: string;
};

export async function POST(request: Request) {
  const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    /* Vercel “Logs” often surface stderr first — use error level for breadcrumbs */
    console.error("[auth/login] POST enter", { reqId });
    console.info("[auth/login] start", { reqId });

    let body: { email?: string; password?: string; keepMeSignedIn?: boolean };
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("[auth/login] invalid JSON", { reqId, parseErr });
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const keepMeSignedIn = Boolean(body.keepMeSignedIn);

    console.info("[auth/login] body_ok", {
      reqId,
      emailHint: emailHint(email),
      hasPassword: password.length > 0,
      passwordLen: password.length,
      keepMeSignedIn,
      debug: DEBUG_AUTH,
    });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      getAuthBackendConfig();
      console.info("[auth/login] ADMINSITE configured", {
        reqId,
        host: authBackendBaseHost(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Server configuration error";
      console.error("[auth/login] config_error", { reqId, message: msg });
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
      console.info("[auth/login] calling AdminSite /api/auth/login", { reqId });
      result = await authBackendPost<Record<string, unknown> | LoginErr>(
        "login",
        {
          email,
          password,
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : undefined;
      console.error("[auth/login] AdminSite fetch threw", {
        reqId,
        message: msg,
        stack: stack?.split("\n").slice(0, 6).join("\n"),
      });
      return NextResponse.json(
        { error: "Could not reach authentication service", code: "ADMINSITE_FETCH_ERROR" },
        { status: 502 }
      );
    }

    const errData = result.data as Record<string, unknown> | LoginErr;
    const errKeys =
      errData && typeof errData === "object" && !Array.isArray(errData)
        ? Object.keys(errData).slice(0, 20)
        : [];

    console.info("[auth/login] AdminSite response", {
      reqId,
      ok: result.ok,
      status: result.status,
      dataKeys: errKeys,
    });

    if (!result.ok) {
      const err = result.data as LoginErr;
      console.warn("[auth/login] AdminSite error body", {
        reqId,
        status: result.status,
        code: err.code,
        error: err.error,
      });
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
      console.error("[auth/login] coerce failed", {
        reqId,
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
      console.info("[auth/login] setting cookies", {
        reqId,
        accountIdLen: coerced.tokens.account_id.length,
        accessLen: coerced.tokens.access_token.length,
        refreshLen: coerced.tokens.refresh_token.length,
        keepMeSignedIn,
      });
      const out = jsonWithAuthCookies(coerced.tokens, keepMeSignedIn);
      console.info("[auth/login] success", { reqId });
      return out;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth/login] session cookies", { reqId, message: msg });
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
    const stack = fatal instanceof Error ? fatal.stack : undefined;
    console.error("[auth/login] FATAL", {
      message: msg,
      stack: stack?.split("\n").slice(0, 12).join("\n"),
      fatal,
    });
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
