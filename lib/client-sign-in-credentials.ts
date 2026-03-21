"use client";

import { signIn } from "next-auth/react";

export type SignInCredentialsResult =
  | { ok: true }
  | { ok: false; error: string; code?: string };

/**
 * Establishes a NextAuth session via the Credentials provider (AdminSite → HAMS login on the server).
 */
export async function signInWithCredentials(opts: {
  email: string;
  password: string;
}): Promise<SignInCredentialsResult> {
  const res = await signIn("credentials", {
    email: opts.email.trim(),
    password: opts.password,
    redirect: false,
  });

  if (res?.error) {
    return {
      ok: false,
      error: res.error,
      code: res.code ?? undefined,
    };
  }
  if (res?.ok) {
    return { ok: true };
  }
  return { ok: false, error: "Sign in failed" };
}
