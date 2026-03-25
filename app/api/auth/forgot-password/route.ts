import { NextResponse } from "next/server";
import { authBackendForgotPassword } from "@/lib/auth-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const result = await authBackendForgotPassword(email);
    if (!result.ok) {
      const d = result.data as { error?: string; code?: string };
      return NextResponse.json(
        { error: d.error || "Request failed", code: d.code },
        { status: result.status >= 400 ? result.status : 502 }
      );
    }
    return NextResponse.json(result.data);
  } catch (e) {
    console.error("[api/auth/forgot-password]", e);
    return NextResponse.json(
      { error: "ADMINSITE_AUTH_BASE_URL is not configured or request failed." },
      { status: 503 }
    );
  }
}
