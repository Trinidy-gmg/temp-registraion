import { NextResponse } from "next/server";

/**
 * Zero app libs — isolates “does any API route work on this Vercel project?”.
 * GET: { ok, node }
 * POST: echoes JSON body length (no auth, no upstream).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/auth/ping",
    node: typeof process !== "undefined" ? process.version : null,
    ts: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const text = await request.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { _parseError: true };
  }
  return NextResponse.json({
    ok: true,
    route: "/api/auth/ping",
    bodyBytes: text.length,
    hasJson: parsed !== null,
    node: typeof process !== "undefined" ? process.version : null,
  });
}
