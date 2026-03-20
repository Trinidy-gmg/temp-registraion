import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-session-cookies";
import { decodeJwtPayloadUnsafe } from "@/lib/decode-jwt-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns whether the browser sent an access-token cookie and best-effort account/email
 * from the JWT payload (unsigned decode — demo UI only).
 */
export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(ACCESS_COOKIE)?.value?.trim();
    if (!token) {
      return NextResponse.json({
        authenticated: false as const,
      });
    }
    const payload = decodeJwtPayloadUnsafe(token);
    const sub = payload?.sub;
    const email = payload?.email;
    return NextResponse.json({
      authenticated: true as const,
      account_id: typeof sub === "string" ? sub : undefined,
      email: typeof email === "string" ? email : undefined,
      token_type: "Bearer",
    });
  } catch (e) {
    console.error("[auth/session]", e);
    return NextResponse.json(
      { authenticated: false as const, error: "session_check_failed" },
      { status: 500 }
    );
  }
}
