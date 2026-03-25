import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOAuthProxyConfig,
  oauthProxyFetchJson,
} from "@/lib/adminsite-oauth-proxy";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["discord", "kickstarter", "steam", "google"]);

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in required", code: "NOT_SIGNED_IN" },
      { status: 401 }
    );
  }

  const { provider: raw } = await ctx.params;
  const provider = (raw || "").toLowerCase();
  if (!ALLOWED.has(provider)) {
    return NextResponse.json(
      { error: "Invalid provider", code: "INVALID_PROVIDER" },
      { status: 400 }
    );
  }

  let accessToken: string | null;
  try {
    getOAuthProxyConfig();
    accessToken = await readHamsAccessTokenFromCookies();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[oauth/links/[provider]] DELETE", msg);
    return NextResponse.json(
      { error: "Account linking is not available right now.", code: "NOT_CONFIGURED" },
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

  const { status, data, ok } = await oauthProxyFetchJson(`/links/${provider}`, {
    accessToken,
    method: "DELETE",
  });

  if (!ok) {
    const body = data as { code?: string; error?: string };
    return NextResponse.json(
      {
        error: body.error || "Could not unlink account",
        code: body.code || "HAMS_ERROR",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }

  return NextResponse.json({ ...(data as object) });
}
