import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";
import {
  jsonWithAuthCookies,
  type LoginTokens,
} from "@/lib/auth-session-cookies";
import {
  EMAIL_VERIFY_COOKIE,
  issueNewVerificationSession,
  verificationCookieOptions,
} from "@/lib/email-verify-session";
import { sendVerificationEmail } from "@/lib/send-verification-email";

type LoginErr = {
  error?: string;
  code?: string;
  account_id?: string;
};

/**
 * If credentials are valid but email is not verified, starts/renews verification
 * (cookie + SendGrid). If already verified, completes a normal login.
 */
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
    console.error("[verification/resume]", msg);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  let result: Awaited<ReturnType<typeof authBackendPost<LoginTokens | LoginErr>>>;
  try {
    result = await authBackendPost<LoginTokens | LoginErr>("login", {
      email,
      password,
    });
  } catch (e) {
    console.error("[verification/resume] AdminSite auth request failed", e);
    return NextResponse.json(
      { error: "Could not reach authentication service" },
      { status: 502 }
    );
  }

  if (result.ok) {
    return jsonWithAuthCookies(result.data as LoginTokens, keepMeSignedIn);
  }

  const err = result.data as LoginErr;
  if (err.code !== "EMAIL_NOT_VERIFIED" || !err.account_id) {
    return NextResponse.json(
      {
        error: err.error || "Sign in failed",
        code: err.code,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const accountId = err.account_id;

  let token: string;
  let code: string;
  let maxAgeSec: number;
  try {
    const issued = issueNewVerificationSession(accountId, email);
    token = issued.token;
    code = issued.code;
    maxAgeSec = issued.maxAgeSec;
  } catch (e) {
    console.error("[verification/resume] session error", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  const sendResult = await sendVerificationEmail(email, code);
  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.error }, { status: 502 });
  }

  const res = NextResponse.json({
    ok: true as const,
    status: "verification_required" as const,
    account_id: accountId,
  });
  res.cookies.set(EMAIL_VERIFY_COOKIE, token, verificationCookieOptions(maxAgeSec));
  return res;
}
