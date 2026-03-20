import { NextResponse } from "next/server";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";

type RegisterOk = { message: string; account_id: string };
type RegisterErr = { error?: string; code?: string };

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    getAuthBackendConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    console.error("[auth/register]", msg);
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  let result: Awaited<ReturnType<typeof authBackendPost<RegisterOk | RegisterErr>>>;
  try {
    result = await authBackendPost<RegisterOk | RegisterErr>("register", {
      email,
      password,
    });
  } catch (e) {
    console.error("[auth/register] AdminSite auth request failed", e);
    return NextResponse.json(
      { error: "Could not reach authentication service" },
      { status: 502 }
    );
  }

  if (!result.ok) {
    const err = result.data as RegisterErr;
    return NextResponse.json(
      {
        error: err.error || "Registration failed",
        code: err.code,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const data = result.data as RegisterOk;
  return NextResponse.json(
    {
      message: data.message,
      account_id: data.account_id,
    },
    { status: 201 }
  );
}
