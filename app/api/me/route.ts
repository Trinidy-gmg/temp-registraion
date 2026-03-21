import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * JSON view of **this site's** session (the faux registration website).
 * Not AdminSite; not a raw HAMS bearer token — use this to confirm the browser is "logged in here".
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        site: "registration-demo",
        authenticated: false,
        user: null,
        message:
          "No active session on this site. POST credentials via NextAuth from /login, or open /login in the browser.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    site: "registration-demo",
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
    session: {
      kind: "next-auth-jwt",
      storage: "httpOnly-cookie",
      scope: "this-origin-only",
      note:
        "After your email/password are accepted by the account API, this site issues its own session cookie. That cookie is what makes you “signed in” to temp-registraion — separate from any AdminSite staff login.",
    },
  });
}
