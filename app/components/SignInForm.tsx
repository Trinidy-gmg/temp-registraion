"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { fetchLoginAfterVerification } from "@/lib/client-login-after-verify";

const KMSI_STORAGE_KEY = "ho-keep-me-signed-in";

const inputClass =
  "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

type VerifyPhase = "none" | "awaiting_send" | "code";

export function SignInForm() {
  const emailId = useId();
  const passwordId = useId();
  const kmsiId = useId();
  const verifyCodeId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("none");
  const [verifyCode, setVerifyCode] = useState("");

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

  function resetVerificationUi() {
    setVerifyPhase("none");
    setVerifyCode("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    resetVerificationUi();
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
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        account_id?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setVerifyPhase("awaiting_send");
          setError(
            data.error ||
              "This account exists but email is not verified yet. Send yourself a new code to finish."
          );
          return;
        }
        throw new Error(data.error || `Sign in failed (${res.status})`);
      }
      setSuccess(`Signed in. Account ID: ${(data as { account_id: string }).account_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendVerificationCode() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verification/resume", {
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
        throw new Error(data.error || `Could not send code (${res.status})`);
      }
      if (data.status === "verification_required") {
        setVerifyPhase("code");
        setSuccess("Verification code sent. Check your email.");
        return;
      }
      if (data.ok && data.account_id) {
        setSuccess(`Signed in. Account ID: ${data.account_id}`);
        resetVerificationUi();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const code = verifyCode.replace(/\s/g, "");
    if (!/^\d{8}$/.test(code)) {
      setError("Enter the 8-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Verification failed (${res.status})`);
      }
      const login = await fetchLoginAfterVerification({
        email: email.trim(),
        password,
        keepMeSignedIn,
      });
      if (!login.ok) {
        throw new Error(
          login.message ||
            "Email verified, but sign-in failed. Try signing in again."
        );
      }
      setSuccess(`Signed in. Account ID: ${login.account_id}`);
      resetVerificationUi();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendWhileSigningIn() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verification/resend", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Could not resend (${res.status})`);
      }
      setSuccess("A new code was sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
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

      {verifyPhase === "code" ? (
        <form onSubmit={handleConfirmVerification} className="mt-6 text-left">
          <p className="font-[family-name:var(--font-outfit)] text-sm text-white/70">
            Enter the 8-digit code we emailed you, then you’ll be signed in.
          </p>
          <div className="mt-4">
            <label
              htmlFor={verifyCodeId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Verification code
            </label>
            <input
              id={verifyCodeId}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="12345678"
              className={`${inputClass} mt-2 font-mono tracking-widest`}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold tracking-wide text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleResendWhileSigningIn()}
            className="mt-3 w-full rounded-md border border-white/20 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/75 hover:bg-white/5 disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      ) : (
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

          {verifyPhase === "awaiting_send" ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSendVerificationCode()}
              className="mt-4 w-full rounded-md border border-amber-500/40 bg-amber-950/25 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold text-amber-100 transition hover:bg-amber-950/40 disabled:opacity-50"
            >
              Email me a verification code
            </button>
          ) : null}

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
      )}
    </div>
  );
}
