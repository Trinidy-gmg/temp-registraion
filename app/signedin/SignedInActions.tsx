"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignedInActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      try {
        await fetch("/api/auth/hams-session", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch {
        /* best-effort clear HAMS httpOnly cookies */
      }
      await signOut({ redirect: false });
    } finally {
      router.replace("/");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSignOut()}
        className="rounded-lg border border-red-500/35 bg-red-950/20 px-5 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-medium text-red-100/95 transition hover:border-red-400/50 hover:bg-red-950/35 disabled:opacity-50"
      >
        {loading ? "Signing out…" : "Sign out of portal"}
      </button>
    </div>
  );
}
