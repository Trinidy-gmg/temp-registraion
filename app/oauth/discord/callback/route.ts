import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeDiscordOAuthFromRequestUrl } from "@/lib/complete-discord-oauth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToSignedIn(request: Request, query: Record<string, string>) {
  const base = new URL(request.url);
  const u = new URL("/signedin", base.origin);
  for (const [k, v] of Object.entries(query)) {
    u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u);
}

/**
 * Discord redirects the browser here (must match HAMS DISCORD_REDIRECT_URI).
 * Server completes the flow with HAMS using httpOnly cookies.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirectToSignedIn(request, {
      discord: "error",
      reason: "not_signed_in",
    });
  }

  const result = await completeDiscordOAuthFromRequestUrl(request.url);

  if (!result.ok) {
    if (result.reason === "discord_denied") {
      return redirectToSignedIn(request, {
        discord: "error",
        reason: "discord_denied",
      });
    }
    if (result.reason === "bad_callback") {
      return redirectToSignedIn(request, {
        discord: "error",
        reason: "bad_callback",
      });
    }
    if (result.reason === "not_configured") {
      return redirectToSignedIn(request, {
        discord: "error",
        reason: "not_configured",
      });
    }
    if (result.reason === "missing_token") {
      return redirectToSignedIn(request, {
        discord: "error",
        reason: "missing_token",
      });
    }
    return redirectToSignedIn(request, {
      discord: "error",
      reason: result.hamsCode || `http_${result.status}`,
    });
  }

  return redirectToSignedIn(request, { discord: "linked" });
}
