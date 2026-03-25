"use client";

import { useState } from "react";

/**
 * Sends a SendGrid reset link to the signed-in account email (HAMS).
 * User completes the change on /reset-password using the link.
 */
export function PasswordSecuritySection() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestEmail() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/password/change-request", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setError(
          data.error ||
            (data.code === "EMAIL_NOT_VERIFIED"
              ? "Verify your email before changing your password."
              : "Could not send the verification email.")
        );
        return;
      }
      setMessage(
        data.message ||
          "Check your email for a link to set a new password. The link expires soon."
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-black/45 p-6 backdrop-blur-sm">
      <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#F0BA19]">
        Password
      </h2>
      <p className="mt-2 max-w-xl font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/55">
        To change your password, we email you a secure link (same flow as “forgot password”). That
        confirms you control this email before the new password is saved.
      </p>
      {error ? (
        <p
          className="mt-3 rounded-md border border-red-500/35 bg-red-950/30 px-3 py-2 font-[family-name:var(--font-outfit)] text-xs text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-3 rounded-md border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 font-[family-name:var(--font-outfit)] text-xs text-emerald-100"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void requestEmail()}
        className="mt-4 w-full max-w-sm rounded-md border border-[#F0BA19]/45 bg-[#F0BA19]/10 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:border-[#F0BA19]/70 hover:bg-[#F0BA19]/20 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Email me a link to change password"}
      </button>
    </section>
  );
}
