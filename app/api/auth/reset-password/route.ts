import { NextResponse } from "next/server";
import { authBackendResetPassword } from "@/lib/auth-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { token?: string; new_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword =
    typeof body.new_password === "string" ? body.new_password : "";
  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "token and new_password are required" },
      { status: 400 }
    );
  }

  try {
    const result = await authBackendResetPassword(token, newPassword);
    if (!result.ok) {
      const d = result.data as { error?: string; code?: string };
      return NextResponse.json(
        { error: d.error || "Reset failed", code: d.code },
        { status: result.status >= 400 ? result.status : 502 }
      );
    }
    return NextResponse.json(result.data);
  } catch (e) {
    console.error("[api/auth/reset-password]", e);
    return NextResponse.json(
      { error: "ADMINSITE_AUTH_BASE_URL is not configured or request failed." },
      { status: 503 }
    );
  }
}
