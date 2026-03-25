"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";

const inputClass =
  "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

export default function ForgotPasswordPage() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setMessage(
        data.message ||
          "If an account exists for that email, we sent a link to reset your password."
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl">
          Forgot password
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm text-white/70">
          Enter your account email. If it matches a Hollowed Oath account, you&apos;ll get a link to
          choose a new password.
        </p>

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
              {message}
            </p>
          ) : null}
          <label
            htmlFor={emailId}
            className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
          >
            Email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-2`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 font-[family-name:var(--font-outfit)] text-sm text-white/50">
          <Link href="/login" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Back to sign in
          </Link>
          {" · "}
          <Link href="/" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Home
          </Link>
        </p>
      </main>
    </HeroBackdrop>
  );
}
