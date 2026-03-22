"use client";

import { useSearchParams } from "next/navigation";
import { messageForLoginCode } from "@/lib/login-error-messages";

export function LoginReasonBanner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const authError = searchParams.get("error");
  const authCode = searchParams.get("code");

  if (reason === "not_signed_in") {
    return (
      <p
        className="mt-4 max-w-lg rounded-md border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm text-amber-100/95"
        role="status"
      >
        Please sign in to view your account.
      </p>
    );
  }

  /** NextAuth redirects here with ?error=CredentialsSignin&code=USER_NOT_FOUND (etc.) */
  if (authError === "CredentialsSignin" && authCode) {
    return (
      <p
        className="mt-4 max-w-lg rounded-md border border-red-500/35 bg-red-950/30 px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm text-red-100/95"
        role="alert"
      >
        {messageForLoginCode(authCode, authError)}
      </p>
    );
  }

  if (authError === "CredentialsSignin") {
    return (
      <p
        className="mt-4 max-w-lg rounded-md border border-red-500/35 bg-red-950/30 px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm text-red-100/95"
        role="alert"
      >
        {messageForLoginCode(undefined, authError)}
      </p>
    );
  }

  return null;
}
