import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHamsApiConfig, hamsFetchJson } from "@/lib/hams-forward";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
    console.error("[oauth/links]", msg);
    return NextResponse.json(
      { links: [], configured: false, message: "HAMS OAuth proxy not configured" },
      { status: 200 }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        links: [],
        configured: true,
        message: "Missing access token; sign in again to load linked accounts.",
      },
      { status: 200 }
    );
  }

  const { status, data, ok } = await hamsFetchJson("/oauth/links", {
    accessToken,
    method: "GET",
  });

  if (!ok) {
    const body = data as { code?: string; error?: string };
    return NextResponse.json(
      {
        error: body.error || "Could not load linked accounts",
        code: body.code || "HAMS_ERROR",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }

  return NextResponse.json({ ...(data as object), configured: true });
}
