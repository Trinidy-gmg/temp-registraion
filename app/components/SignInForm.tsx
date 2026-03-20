"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const KMSI_STORAGE_KEY = "ho-keep-me-signed-in";

const inputClass =
  "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

export function SignInForm() {
  const emailId = useId();
  const passwordId = useId();
  const kmsiId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KMSI_STORAGE_KEY);
      if (stored === "true") setKeepMeSignedIn(true);
    } catch {
      /* ignore */
    }
  }, []);

  function handleKmsiChange(checked: boolean) {
    setKeepMeSignedIn(checked);
    try {
      if (checked) localStorage.setItem(KMSI_STORAGE_KEY, "true");
      else localStorage.removeItem(KMSI_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
          keepMeSignedIn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Sign in failed (${res.status})`);
      }
      setSuccess(`Signed in. Account ID: ${(data as { account_id: string }).account_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8">
      <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold text-white">
        Sign in
      </h2>
      <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs text-white/50">
        Use the email and password for your Hollowed Oath account.
      </p>

      {error ? (
        <p
          className="mt-4 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-left font-[family-name:var(--font-outfit)] text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-left font-[family-name:var(--font-outfit)] text-sm text-emerald-100"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 text-left">
        <div>
          <label
            htmlFor={emailId}
            className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
          >
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${inputClass} mt-2`}
            disabled={loading}
            required
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor={passwordId}
            className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
          >
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={`${inputClass} mt-2`}
            disabled={loading}
            required
          />
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 select-none">
          <input
            id={kmsiId}
            type="checkbox"
            checked={keepMeSignedIn}
            onChange={(e) => handleKmsiChange(e.target.checked)}
            className="peer sr-only"
            disabled={loading}
          />
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/25 bg-black/30 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#F0BA19]/50 peer-hover:border-[#F0BA19]/50 peer-checked:border-[#F0BA19] peer-checked:bg-[#F0BA19]/20"
            aria-hidden
          >
            {keepMeSignedIn ? (
              <svg
                className="h-3 w-3 text-[#F0BA19]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </span>
          <span className="font-[family-name:var(--font-outfit)] text-sm text-white/85">
            Keep me signed in
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold tracking-wide text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 hover:shadow-[0_0_20px_rgba(240,186,25,0.35)] disabled:opacity-50"
        >
          {loading ? "Please wait…" : "Sign in"}
        </button>

        <p className="mt-6 text-center font-[family-name:var(--font-outfit)] text-sm text-white/55">
          New to Hollowed Oath?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#F0BA19] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
