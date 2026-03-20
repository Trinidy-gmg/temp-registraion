import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";
import {
  EMAIL_VERIFY_COOKIE,
  isSignupVerifySecretConfigured,
  issueNewVerificationSession,
  verificationCookieOptions,
} from "@/lib/email-verify-session";
import { sendVerificationEmail } from "@/lib/send-verification-email";

type RegisterOk = { message: string; account_id: string };
type RegisterErr = { error?: string; code?: string };

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (!isSignupVerifySecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Registration verification is not configured (set SIGNUP_VERIFY_SECRET, min 16 characters).",
      },
      { status: 503 }
    );
  }

  try {
    getAuthBackendConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[auth/register]", msg);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  let result: Awaited<ReturnType<typeof authBackendPost<RegisterOk | RegisterErr>>>;
  try {
    result = await authBackendPost<RegisterOk | RegisterErr>("register", {
      email,
      password,
    });
  } catch (e) {
    console.error("[auth/register] AdminSite auth request failed", e);
    return NextResponse.json(
      { error: "Could not reach authentication service" },
      { status: 502 }
    );
  }

  if (!result.ok) {
    const err = result.data as RegisterErr;
    return NextResponse.json(
      {
        error: err.error || "Registration failed",
        code: err.code,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const data = result.data as RegisterOk;
  const accountId = data.account_id;

  let token: string;
  let code: string;
  let maxAgeSec: number;
  try {
    const issued = issueNewVerificationSession(accountId, email);
    token = issued.token;
    code = issued.code;
    maxAgeSec = issued.maxAgeSec;
  } catch (e) {
    console.error("[auth/register] verification session error", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  const sendResult = await sendVerificationEmail(email, code);

  const res = NextResponse.json(
    {
      message: data.message,
      account_id: accountId,
      verification_required: true,
      verification_email_sent: sendResult.ok,
      ...(sendResult.ok ? {} : { verification_email_error: sendResult.error }),
    },
    { status: 201 }
  );

  res.cookies.set(EMAIL_VERIFY_COOKIE, token, verificationCookieOptions(maxAgeSec));

  return res;
}
