import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authBackendMarkEmailVerified, getAuthBackendConfig } from "@/lib/auth-backend";
import { clearEmailVerifyCookie } from "@/lib/auth-session-cookies";
import {
  EMAIL_VERIFY_COOKIE,
  codeMatchesPayload,
  openEmailVerifyToken,
} from "@/lib/email-verify-session";

export const dynamic = "force-dynamic";

type MarkErr = { error?: string; code?: string };

/**
 * Verifies the 8-digit code and marks email verified on HAMS.
 * The browser should then call NextAuth `signIn("credentials", { email, password })` to open a session.
 */
export async function POST(request: Request) {
  try {
    let body: {
      code?: string;
      password?: string;
      keepMeSignedIn?: boolean;
      verification_session?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const codeRaw = typeof body.code === "string" ? body.code : "";
    const code = codeRaw.replace(/\s/g, "");
    if (!/^\d{8}$/.test(code)) {
      return NextResponse.json(
        { error: "Enter the 8-digit code from your email" },
        { status: 400 }
      );
    }

    const bodySession =
      typeof body.verification_session === "string"
        ? body.verification_session.trim()
        : "";

    const jar = await cookies();
    const rawCookie = jar.get(EMAIL_VERIFY_COOKIE)?.value;
    const raw = bodySession || rawCookie || "";
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
              ? "Sign-in is temporarily unavailable. Please try again later."
              : "Something went wrong on our end. Please try again later.",
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
      const err = marked.data as MarkErr;
      return NextResponse.json(
        {
          error: err.error || "Could not verify account",
          code: err.code,
        },
        { status: marked.status >= 400 && marked.status < 600 ? marked.status : 502 }
      );
    }

    const accountId =
      typeof marked.data.account_id === "string" && marked.data.account_id
        ? marked.data.account_id
        : payload.aid;

    const res = NextResponse.json({
      ok: true as const,
      verified: true as const,
      account_id: accountId,
      /** Hint for clients: NextAuth credentials sign-in with email + password. */
      next: "signIn" as const,
    });
    clearEmailVerifyCookie(res);
    return res;
  } catch (fatal: unknown) {
    const msg = fatal instanceof Error ? fatal.message : String(fatal);
    console.error("[verification/confirm] FATAL", fatal);
    return NextResponse.json(
      {
        error:
          "We couldn't finish verifying your email. Please try again, or request a new code.",
        code: "CONFIRM_FATAL",
      },
      { status: 500 }
    );
  }
}
