import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-session-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clears httpOnly auth cookies (demo session).
 */
export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true as const });

  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    try {
      res.cookies.set(name, "", {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    } catch {
      /* ignore */
    }
  }

  return res;
}
