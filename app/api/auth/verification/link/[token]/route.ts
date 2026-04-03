import { NextResponse } from "next/server";
import {
  openEmailVerifyToken,
} from "@/lib/email-verify-session";
import { clearEmailVerifyCookie } from "@/lib/auth-session-cookies";
import { authBackendMarkEmailVerified, getAuthBackendConfig } from "@/lib/auth-backend";

export const dynamic = "force-dynamic";

function redirectHome() {
  return NextResponse.redirect(new URL("https://hollowedoath.com"));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const raw = (token || "").trim();
  if (!raw) {
    return NextResponse.redirect(
      new URL("https://hollowedoath.com/login?reason=verification_missing")
    );
  }

  const payload = openEmailVerifyToken(raw);
  if (!payload) {
    return NextResponse.redirect(
      new URL("https://hollowedoath.com/login?reason=verification_invalid")
    );
  }

  try {
    getAuthBackendConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[verification/link]", msg);
    return NextResponse.redirect(
      new URL("https://hollowedoath.com/login?reason=verification_unavailable")
    );
  }

  const marked = await authBackendMarkEmailVerified(payload.aid);
  if (!marked.ok) {
    console.error("[verification/link] mark failed", marked.status, marked.data);
    return NextResponse.redirect(
      new URL("https://hollowedoath.com/login?reason=verification_failed")
    );
  }

  const res = redirectHome();
  clearEmailVerifyCookie(res);
  return res;
}