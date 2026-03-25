"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";

const inputClass =
  "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = (searchParams.get("token") || "").trim();

  const pwId = useId();
  const pw2Id = useId();
  const tokenId = useId();

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    const t = token.trim();
    if (!t) {
      setError("Paste the token from your email, or open the link from the email directly.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token: t, new_password: password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setError(data.error || "Reset failed. The link may have expired.");
        return;
      }
      setMessage(data.message || "Password updated. You can sign in with your new password.");
      setPassword("");
      setPassword2("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-8 w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 text-left backdrop-blur-sm md:px-8"
    >
      {error ? (
        <p
          className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100"
          role="status"
        >
          {message}{" "}
          <Link href="/login" className="font-semibold text-[#F0BA19] underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}

      <label
        htmlFor={tokenId}
        className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
      >
        Reset token
      </label>
      <input
        id={tokenId}
        type="text"
        name="token"
        autoComplete="off"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="From your email link"
        className={`${inputClass} mt-2 font-mono text-xs`}
        disabled={loading}
      />

      <label
        htmlFor={pwId}
        className="mt-4 block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
      >
        New password
      </label>
      <input
        id={pwId}
        type="password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${inputClass} mt-2`}
        disabled={loading}
        minLength={8}
        required
      />

      <label
        htmlFor={pw2Id}
        className="mt-4 block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
      >
        Confirm new password
      </label>
      <input
        id={pw2Id}
        type="password"
        name="password2"
        autoComplete="new-password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        className={`${inputClass} mt-2`}
        disabled={loading}
        minLength={8}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl">
          Reset password
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm text-white/70">
          Use the link from your email, or paste the token below. Then choose a new password.
        </p>
        <Suspense fallback={<div className="mt-8 text-white/50">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-8 font-[family-name:var(--font-outfit)] text-sm text-white/50">
          <Link href="/login" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/forgot-password" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Request a new link
          </Link>
        </p>
      </main>
    </HeroBackdrop>
  );
}
