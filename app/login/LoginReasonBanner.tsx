"use client";

import { useSearchParams } from "next/navigation";

export function LoginReasonBanner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

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

  return null;
}
