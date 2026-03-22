/**
 * Browser-only: after email is verified, establish a NextAuth session via Credentials.
 * Retries once if HAMS still reports EMAIL_NOT_VERIFIED (eventual consistency).
 */

import { getSession } from "next-auth/react";
import { signInWithCredentials } from "@/lib/client-sign-in-credentials";
import { messageForLoginCode } from "@/lib/login-error-messages";

export async function fetchLoginAfterVerification(opts: {
  email: string;
  password: string;
  keepMeSignedIn: boolean;
}): Promise<
  | { ok: true; account_id: string }
  | { ok: false; message: string; code?: string; hint?: string }
> {
  const { email, password, keepMeSignedIn: _keepMeSignedIn } = opts;
  void _keepMeSignedIn; /* reserved for future NextAuth session maxAge */

  const tryOnce = () =>
    signInWithCredentials({ email: email.trim(), password });

  let login = await tryOnce();

  if (!login.ok && login.code === "EMAIL_NOT_VERIFIED") {
    await new Promise((r) => setTimeout(r, 400));
    login = await tryOnce();
  }

  if (!login.ok) {
    return {
      ok: false,
      message: messageForLoginCode(login.code, login.error),
      code: login.code,
    };
  }

  const session = await getSession();
  const account_id =
    typeof session?.user?.id === "string" ? session.user.id.trim() : "";
  if (!account_id) {
    return {
      ok: false,
      message:
        "Sign-in didn't complete properly. Please try signing in again.",
    };
  }

  return { ok: true, account_id };
}
