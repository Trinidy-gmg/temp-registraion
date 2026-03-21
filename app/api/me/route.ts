import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** JSON view of the signed-in Hollowed Oath account portal session (user id + email). */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        site: "hollowed-oath-account-portal",
        authenticated: false,
        user: null,
        message: "No active session. Sign in at /login to access your account.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    site: "hollowed-oath-account-portal",
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
    session: {
      kind: "signed-in-portal",
      note:
        "You are signed in to the Hollowed Oath account portal. This record reflects your verified account profile.",
    },
  });
}
