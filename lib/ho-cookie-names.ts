/**
 * HttpOnly cookie names only — no crypto, no env.
 * Keeps /api/auth/login from importing email-verify-session (Node crypto),
 * which can break Edge / module init before the route handler runs.
 */

export const ACCESS_COOKIE = "ho_access_token";
export const REFRESH_COOKIE = "ho_refresh_token";
export const EMAIL_VERIFY_COOKIE = "ho_email_verify";
