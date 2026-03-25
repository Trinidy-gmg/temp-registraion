import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOAuthProxyConfig,
  oauthProxyFetchJson,
} from "@/lib/adminsite-oauth-proxy";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signed-in player: HAMS emails a reset link (SendGrid). Completing reset uses /reset-password.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in required", code: "NOT_SIGNED_IN" },
      { status: 401 }
    );
  }

  let accessToken: string | null;
  try {
    getOAuthProxyConfig();
    accessToken = await readHamsAccessTokenFromCookies();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[password/change-request]", msg);
    return NextResponse.json(
      { error: "Password change is not available right now.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Your session does not have a fresh game login token. Please sign out and sign in again.",
        code: "MISSING_ACCESS_TOKEN",
      },
      { status: 401 }
    );
  }

  const { status, data, ok } = await oauthProxyFetchJson(
    "/change-password/request-email",
    {
      accessToken,
      method: "POST",
    }
  );

  if (!ok) {
    const body = data as { code?: string; error?: string };
    return NextResponse.json(
      {
        error: body.error || "Could not send verification email",
        code: body.code || "HAMS_ERROR",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }

  return NextResponse.json({ ...(data as object) });
}
