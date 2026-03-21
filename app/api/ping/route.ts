import { NextResponse } from "next/server";

/**
 * Short URL health check — same idea as /api/auth/ping.
 * If this 404s on Vercel, the deployment does not include this file (wrong branch,
 * old build, or Root Directory in Vercel is not the folder that contains `app/`).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/ping",
    node: typeof process !== "undefined" ? process.version : null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    ts: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const text = await request.text();
  return NextResponse.json({
    ok: true,
    route: "/api/ping",
    bodyBytes: text.length,
    node: typeof process !== "undefined" ? process.version : null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
