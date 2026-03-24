import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHamsApiConfig, hamsFetchJson } from "@/lib/hams-forward";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InitiateOk = {
  authorization_url: string;
  state: string;
};

/**
 * Starts Discord linking: forwards to HAMS with the player access token (httpOnly cookie).
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
    getHamsApiConfig();
    accessToken = await readHamsAccessTokenFromCookies();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[oauth/discord/initiate]", msg);
    return NextResponse.json(
      { error: "Discord linking is not available right now.", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Your session does not have a fresh game login token. Please sign out and sign in again, then try linking Discord.",
        code: "MISSING_ACCESS_TOKEN",
      },
      { status: 401 }
    );
  }

  const { status, data, ok } = await hamsFetchJson("/oauth/discord/initiate", {
    accessToken,
    method: "POST",
  });

  if (!ok) {
    const body = data as { code?: string; error?: string };
    return NextResponse.json(
      {
        error: body.error || "Could not start Discord linking",
        code: body.code || "HAMS_ERROR",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }

  const parsed = data as Partial<InitiateOk>;
  if (
    typeof parsed.authorization_url !== "string" ||
    typeof parsed.state !== "string"
  ) {
    return NextResponse.json(
      { error: "Unexpected response from account service", code: "BAD_RESPONSE" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    authorization_url: parsed.authorization_url,
    state: parsed.state,
  });
}
