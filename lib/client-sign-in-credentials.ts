"use client";

import { signIn } from "next-auth/react";

export type SignInCredentialsResult =
  | { ok: true }
  | { ok: false; error: string; code?: string };

function parseCodeFromAuthUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  try {
    return new URL(url).searchParams.get("code") ?? undefined;
  } catch {
    try {
      const base =
        typeof window !== "undefined" ? window.location.origin : "http://localhost";
      return new URL(url, base).searchParams.get("code") ?? undefined;
    } catch {
      return undefined;
    }
  }
}

/** Establishes a NextAuth session after the server verifies email + password. */
export async function signInWithCredentials(opts: {
  email: string;
  password: string;
}): Promise<SignInCredentialsResult> {
  let res: Awaited<ReturnType<typeof signIn>> | undefined;
  try {
    res = await signIn("credentials", {
      email: opts.email.trim(),
      password: opts.password,
      redirect: false,
    });
  } catch {
    return { ok: false, error: "Sign in failed" };
  }

  if (res?.error) {
    const withUrl = res as { code?: string; url?: string | null };
    const code = withUrl.code ?? parseCodeFromAuthUrl(withUrl.url ?? undefined);
    return {
      ok: false,
      error: res.error,
      code: code ?? undefined,
    };
  }
  if (res?.ok) {
    return { ok: true };
  }
  return { ok: false, error: "Sign in failed" };
}
