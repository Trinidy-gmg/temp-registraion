import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOAuthProxyConfig,
  oauthProxyFetchJson,
} from "@/lib/adminsite-oauth-proxy";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** HAMS `GET /me` shape (subset typed for merge). */
type HamsMeProfile = {
  account_id?: string;
  email?: string;
  email_verified?: boolean;
  account_status?: string;
  created_at?: string;
  kickstarter_backer?: boolean;
  kickstarter_tier?: number | null;
  locked_until?: string | null;
  lock_reason?: string | null;
  last_login_at?: string | null;
  oauth_links?: Array<{
    provider?: string;
    external_username?: string | null;
    external_avatar_url?: string | null;
    linked_at?: string;
  }>;
};

/**
 * Portal session plus HAMS account profile when access cookie + AdminSite proxy are available.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        site: "hollowed-oath-account-portal",
        authenticated: false,
        user: null,
        profile: null,
        message: "No active session. Sign in at /login to access your account.",
      },
      { status: 401 }
    );
  }

  let profile: HamsMeProfile | null = null;
  let profile_note: string | null = null;

  try {
    getOAuthProxyConfig();
    const accessToken = await readHamsAccessTokenFromCookies();
    if (!accessToken) {
      profile_note =
        "Sign out and sign in again to load full account details (HAMS access token missing).";
    } else {
      const { ok, status, data } = await oauthProxyFetchJson("/me", {
        accessToken,
        method: "GET",
      });
      if (ok && data && typeof data === "object" && !Array.isArray(data)) {
        profile = data as HamsMeProfile;
      } else {
        const err = data as { error?: string; code?: string };
        profile_note =
          err.error ||
          err.code ||
          `Could not load account profile (${status}). Try signing in again.`;
      }
    }
  } catch {
    profile_note =
      "Account profile unavailable (check ADMINSITE_AUTH_BASE_URL and REGISTRATION_VERIFY_SECRET).";
  }

  const sessionUserId = session.user.id;
  const sessionEmail =
    typeof session.user.email === "string" ? session.user.email : null;

  return NextResponse.json({
    site: "hollowed-oath-account-portal",
    authenticated: true,
    user: {
      id: sessionUserId,
      email: sessionEmail,
    },
    profile,
    profile_note,
    session: {
      kind: "signed-in-portal",
      note:
        "User id/email come from the portal session. `profile` is from HAMS when your login token is present — includes status (active/locked/disabled), Kickstarter flags, lock metadata, and linked OAuth accounts (e.g. Discord).",
    },
  });
}
