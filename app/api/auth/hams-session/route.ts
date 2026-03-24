import { NextResponse } from "next/server";
import { clearHamsAuthCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";

/**
 * Clears httpOnly HAMS token cookies. Call before or after NextAuth sign-out
 * so stale tokens are not reused for OAuth proxy routes.
 */
export async function POST() {
  await clearHamsAuthCookies();
  return NextResponse.json({ ok: true });
}
