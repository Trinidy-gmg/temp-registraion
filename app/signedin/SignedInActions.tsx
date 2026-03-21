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
      await signOut({ redirect: false });
    } finally {
      router.replace("/");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleSignOut()}
        className="rounded-md border border-white/25 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
