import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  EMAIL_VERIFY_COOKIE,
  issueNewVerificationSession,
  openEmailVerifyToken,
  verificationCookieOptions,
} from "@/lib/email-verify-session";
import { sendVerificationEmail } from "@/lib/send-verification-email";

/**
 * Resend verification email using the existing pending-verification cookie
 * or `verification_session` from the JSON body (desktop patcher).
 */
export async function POST(request: Request) {
  let bodySession = "";
  try {
    const b = (await request.json()) as { verification_session?: string };
    if (typeof b?.verification_session === "string") {
      bodySession = b.verification_session.trim();
    }
  } catch {
    // no JSON body — cookie-only clients
  }

  const jar = await cookies();
  const raw = bodySession || jar.get(EMAIL_VERIFY_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json(
      { error: "No pending verification session" },
      { status: 400 }
    );
  }

  const prev = openEmailVerifyToken(raw);
  if (!prev) {
    return NextResponse.json(
      { error: "Verification session expired or invalid" },
      { status: 400 }
    );
  }

  let token: string;
  let code: string;
  let maxAgeSec: number;
  try {
    const issued = issueNewVerificationSession(prev.aid, prev.email);
    token = issued.token;
    code = issued.code;
    maxAgeSec = issued.maxAgeSec;
  } catch (e) {
    console.error("[verification/resend]", e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 503 }
    );
  }

  const verificationLink = new URL(
    `/api/auth/verification/link/${token}`,
    "https://hollowedoath.com"
  ).toString();

  const sendResult = await sendVerificationEmail(
    prev.email,
    code,
    verificationLink
  );
  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.error }, { status: 502 });
  }

  const res = NextResponse.json({
    ok: true as const,
    ...(bodySession ? { verification_session: token } : {}),
  });
  if (!bodySession) {
    res.cookies.set(EMAIL_VERIFY_COOKIE, token, verificationCookieOptions(maxAgeSec));
  }
  return res;
}
