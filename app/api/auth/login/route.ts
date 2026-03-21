import { NextResponse } from "next/server";

/**
 * Keep static imports minimal so a bad submodule can’t kill module init before POST runs.
 * Auth libs load via dynamic import inside POST — failures return JSON with code LOGIN_LOAD_FAILED.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withLoginMeta(
  res: NextResponse,
  reqId: string,
  meta?: { stage: string; adminsiteStatus?: number }
): NextResponse {
  res.headers.set("x-login-req-id", reqId);
  if (meta?.stage) {
    res.headers.set("x-login-stage", meta.stage);
  }
  if (meta?.adminsiteStatus != null) {
    res.headers.set("x-adminsite-status", String(meta.adminsiteStatus));
  }
  return res;
}

/** Proves this deployment serves the App Router login route (check Network tab). */
export async function GET() {
  const reqId = `get-${Date.now().toString(36)}`;
  return withLoginMeta(
    NextResponse.json({
      ok: true,
      route: "/api/auth/login",
      runtime: "nodejs",
      ts: new Date().toISOString(),
      hint: "Check POST response headers: x-login-stage (where it stopped), x-adminsite-status (upstream HTTP status).",
    }),
    reqId,
    { stage: "get" }
  );
}

const DEBUG_AUTH = process.env.REGISTRATION_DEBUG_AUTH === "1";
const SKIP_COOKIES = process.env.REGISTRATION_SKIP_AUTH_COOKIES === "1";

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
    console.error("[auth/login] POST enter", { reqId, skipCookies: SKIP_COOKIES });

    type AuthBackend = typeof import("@/lib/auth-backend");
    type SessionCookies = typeof import("@/lib/auth-session-cookies");

    let authBackend: AuthBackend;
    let sessionCookies: SessionCookies;
    try {
      [authBackend, sessionCookies] = await Promise.all([
        import("@/lib/auth-backend"),
        import("@/lib/auth-session-cookies"),
      ]);
    } catch (loadErr) {
      const msg = loadErr instanceof Error ? loadErr.message : String(loadErr);
      const stack = loadErr instanceof Error ? loadErr.stack : undefined;
      console.error("[auth/login] dynamic import failed", { reqId, msg, stack });
      return withLoginMeta(
        NextResponse.json(
          {
            error:
              "Login route could not load server modules (dynamic import failed). Check Vercel build and Node runtime.",
            code: "LOGIN_LOAD_FAILED",
            hint: msg.slice(0, 300),
          },
          { status: 500 }
        ),
        reqId,
        { stage: "load_failed" }
      );
    }

    const {
      authBackendPost,
      authBackendBaseHost,
      getAuthBackendConfig,
    } = authBackend;
    const {
      coerceLoginTokens,
      jsonWithAuthCookiesHeaders,
      estimateAuthSetCookieBytes,
    } = sessionCookies;

    let body: { email?: string; password?: string; keepMeSignedIn?: boolean };
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("[auth/login] invalid JSON", { reqId, parseErr });
      return withLoginMeta(
        NextResponse.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 }),
        reqId,
        { stage: "invalid_json" }
      );
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
      return withLoginMeta(
        NextResponse.json(
          { error: "Email and password are required", code: "VALIDATION" },
          { status: 400 }
        ),
        reqId,
        { stage: "validation" }
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
      return withLoginMeta(
        NextResponse.json(
          {
            error:
              msg === "ADMINSITE_AUTH_BASE_URL is not configured"
                ? "Set ADMINSITE_AUTH_BASE_URL on this Vercel project (public AdminSite origin, no trailing slash)."
                : "Server configuration error",
            code:
              msg === "ADMINSITE_AUTH_BASE_URL is not configured"
                ? "AUTH_BACKEND_NOT_CONFIGURED"
                : "CONFIG_ERROR",
          },
          { status: 503 }
        ),
        reqId,
        { stage: "config_error" }
      );
    }

    let result: Awaited<
      ReturnType<typeof authBackendPost<Record<string, unknown> | LoginErr>>
    >;
    try {
      console.info("[auth/login] calling AdminSite /api/auth/login", { reqId });
      result = await authBackendPost<Record<string, unknown> | LoginErr>("login", {
        email,
        password,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : undefined;
      console.error("[auth/login] AdminSite fetch threw", {
        reqId,
        message: msg,
        stack: stack?.split("\n").slice(0, 6).join("\n"),
      });
      return withLoginMeta(
        NextResponse.json(
          {
            error: "Could not reach authentication service",
            code: "ADMINSITE_FETCH_ERROR",
            hint: msg.slice(0, 200),
          },
          { status: 502 }
        ),
        reqId,
        { stage: "fetch_error" }
      );
    }

    const errData = result.data as Record<string, unknown> | LoginErr;
    const errKeys =
      errData && typeof errData === "object" && !Array.isArray(errData)
        ? Object.keys(errData as object).slice(0, 20)
        : [];

    console.info("[auth/login] AdminSite response", {
      reqId,
      ok: result.ok,
      status: result.status,
      dataKeys: errKeys,
    });

    if (!result.ok) {
      const err = result.data as LoginErr;
      const upstreamCode =
        err.code ??
        (result.status === 500 ? "ADMINSITE_HTTP_500" : "ADMINSITE_UPSTREAM_ERROR");
      console.warn("[auth/login] AdminSite error body", {
        reqId,
        status: result.status,
        code: err.code,
        error: err.error,
      });
      return withLoginMeta(
        NextResponse.json(
          {
            error: err.error || "Sign in failed",
            code: upstreamCode,
            ...(err.code === "EMAIL_NOT_VERIFIED" && err.account_id
              ? { account_id: err.account_id }
              : {}),
          },
          {
            status:
              result.status >= 400 && result.status < 600 ? result.status : 502,
          }
        ),
        reqId,
        { stage: "upstream_error", adminsiteStatus: result.status }
      );
    }

    const coerced = coerceLoginTokens(result.data);
    if (!coerced.ok) {
      console.error("[auth/login] coerce failed", {
        reqId,
        reason: coerced.reason,
        keys: coerced.keys,
      });
      return withLoginMeta(
        NextResponse.json(
          {
            error:
              "Auth service returned success but the login payload did not include access_token, refresh_token, and account_id (or camelCase equivalents). Check AdminSite → HAMS POST /login response.",
            code: "LOGIN_INCOMPLETE",
            reason: coerced.reason,
            keys: coerced.keys,
          },
          { status: 502 }
        ),
        reqId,
        { stage: "coerce_fail" }
      );
    }

    if (SKIP_COOKIES) {
      console.warn("[auth/login] REGISTRATION_SKIP_AUTH_COOKIES=1 — not setting cookies", {
        reqId,
      });
      return withLoginMeta(
        NextResponse.json({
          ok: true as const,
          account_id: coerced.tokens.account_id,
          token_type: coerced.tokens.token_type ?? "Bearer",
          cookies_skipped: true as const,
          warning:
            "Debug only: unset REGISTRATION_SKIP_AUTH_COOKIES after testing. Tokens were not stored.",
        }),
        reqId,
        { stage: "cookies_skipped" }
      );
    }

    try {
      const approxBytes = estimateAuthSetCookieBytes(coerced.tokens, keepMeSignedIn);
      console.info("[auth/login] setting cookies", {
        reqId,
        accountIdLen: coerced.tokens.account_id.length,
        accessLen: coerced.tokens.access_token.length,
        refreshLen: coerced.tokens.refresh_token.length,
        approxSetCookieBytes: approxBytes,
        keepMeSignedIn,
      });

      const out = jsonWithAuthCookiesHeaders(coerced.tokens, keepMeSignedIn);
      return withLoginMeta(out, reqId, { stage: "ok" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth/login] session cookies", { reqId, message: msg });
      if (
        msg === "LOGIN_RESPONSE_MISSING_TOKENS" ||
        msg === "LOGIN_RESPONSE_MISSING_ACCOUNT_ID"
      ) {
        return withLoginMeta(
          NextResponse.json(
            {
              error:
                "Auth service login response was incomplete (tokens or account_id). Check AdminSite → HAMS login JSON.",
              code: "LOGIN_INCOMPLETE",
            },
            { status: 502 }
          ),
          reqId,
          { stage: "coerce_throw" }
        );
      }
      if (msg.startsWith("LOGIN_TOKEN_COOKIE_TOO_LARGE")) {
        return withLoginMeta(
          NextResponse.json(
            {
              error:
                "Access or refresh token is too large for a browser cookie (~4KB limit). Shorten JWT claims in HAMS or use a different session strategy.",
              code: "LOGIN_TOKEN_TOO_LARGE",
              hint: msg.slice(0, 200),
            },
            { status: 502 }
          ),
          reqId,
          { stage: "token_too_large" }
        );
      }
      if (msg.startsWith("LOGIN_COOKIE_HEADERS_TOO_LARGE")) {
        return withLoginMeta(
          NextResponse.json(
            {
              error:
                "Combined Set-Cookie headers exceed the proxy limit (~8KB on many hosts). Shorten JWTs in HAMS or use server-side sessions instead of full tokens in cookies.",
              code: "LOGIN_COOKIE_HEADERS_TOO_LARGE",
              hint: msg.slice(0, 240),
            },
            { status: 502 }
          ),
          reqId,
          { stage: "headers_too_large" }
        );
      }
      return withLoginMeta(
        NextResponse.json(
          {
            error: "Could not set session cookies. Try again.",
            code: "SESSION_COOKIE_ERROR",
            hint: msg.slice(0, 200),
          },
          { status: 500 }
        ),
        reqId,
        { stage: "session_cookie_error" }
      );
    }
  } catch (fatal: unknown) {
    const msg = fatal instanceof Error ? fatal.message : String(fatal);
    const stack = fatal instanceof Error ? fatal.stack : undefined;
    console.error("[auth/login] FATAL", {
      reqId,
      message: msg,
      stack: stack?.split("\n").slice(0, 12).join("\n"),
      fatal,
    });
    return withLoginMeta(
      NextResponse.json(
        {
          error: "Sign-in failed unexpectedly. Check Vercel function logs for [auth/login].",
          code: "LOGIN_FATAL",
          hint: msg.slice(0, 200),
        },
        { status: 500 }
      ),
      reqId,
      { stage: "fatal" }
    );
  }
}
