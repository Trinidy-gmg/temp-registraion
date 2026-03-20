"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { hasTermsScrollAck } from "@/lib/terms-ack";

const KMSI_STORAGE_KEY = "ho-keep-me-signed-in";

const TERMS_NEXT = "/terms?next=" + encodeURIComponent("/?signup=1");

type View = "login" | "signup";

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("login");

  const loginEmailId = useId();
  const loginPasswordId = useId();
  const kmsiId = useId();

  const signupEmailId = useId();
  const signupPasswordId = useId();
  const signupConfirmId = useId();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [signedInAccountId, setSignedInAccountId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KMSI_STORAGE_KEY);
      if (stored === "true") setKeepMeSignedIn(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("signup") !== "1") return;
    if (!hasTermsScrollAck()) {
      router.replace(TERMS_NEXT);
      return;
    }
    setView("signup");
  }, [searchParams, router]);

  function handleKmsiChange(checked: boolean) {
    setKeepMeSignedIn(checked);
    try {
      if (checked) localStorage.setItem(KMSI_STORAGE_KEY, "true");
      else localStorage.removeItem(KMSI_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

  async function doLogin(email: string, password: string, kmsi: boolean) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email,
        password,
        keepMeSignedIn: kmsi,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Sign in failed (${res.status})`);
    }
    return data as { ok: true; account_id: string };
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSignedInAccountId(null);
    setLoading(true);
    try {
      const data = await doLogin(loginEmail.trim(), loginPassword, keepMeSignedIn);
      setSignedInAccountId(data.account_id);
      setSuccess(`Signed in. Account ID: ${data.account_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSignedInAccountId(null);

    if (!hasTermsScrollAck()) {
      setError("Please read the demo terms to the bottom before creating an account.");
      router.push(TERMS_NEXT);
      return;
    }

    const email = signupEmail.trim();
    if (!email || !signupPassword) {
      setError("Email and password are required.");
      return;
    }
    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password: signupPassword }),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) {
        throw new Error(regData.error || `Registration failed (${regRes.status})`);
      }

      const accountId = regData.account_id as string;

      try {
        const loginData = await doLogin(email, signupPassword, keepMeSignedIn);
        setSignedInAccountId(loginData.account_id);
        setSuccess(
          `Welcome! Account ${loginData.account_id} — you’re signed in.`
        );
        setSignupPassword("");
        setSignupConfirm("");
      } catch (loginErr) {
        setView("login");
        setLoginEmail(email);
        setSuccess(null);
        setError(
          loginErr instanceof Error
            ? `Account created (${accountId}), but sign-in failed: ${loginErr.message}`
            : `Account created (${accountId}), but sign-in failed. Try signing in manually.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8">
      <div className="flex gap-1 rounded-lg border border-[#F0BA19]/20 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => {
            setView("login");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 rounded-md py-2 font-[family-name:var(--font-outfit)] text-sm font-medium transition ${
            view === "login"
              ? "bg-[#F0BA19]/20 text-[#F0BA19]"
              : "text-white/60 hover:text-white/85"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setSuccess(null);
            if (!hasTermsScrollAck()) {
              router.push(TERMS_NEXT);
              return;
            }
            setView("signup");
          }}
          className={`flex-1 rounded-md py-2 font-[family-name:var(--font-outfit)] text-sm font-medium transition ${
            view === "signup"
              ? "bg-[#F0BA19]/20 text-[#F0BA19]"
              : "text-white/60 hover:text-white/85"
          }`}
        >
          Create account
        </button>
      </div>

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
          className={`mt-4 rounded-md border px-3 py-2 text-left font-[family-name:var(--font-outfit)] text-sm ${
            signedInAccountId
              ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
              : "border-[#F0BA19]/30 bg-[#F0BA19]/10 text-[#F0BA19]/95"
          }`}
          role="status"
        >
          {success}
        </p>
      ) : null}

      {view === "login" ? (
        <form onSubmit={handleLoginSubmit} className="mt-6 text-left">
          <div>
            <label
              htmlFor={loginEmailId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Email
            </label>
            <input
              id={loginEmailId}
              name="email"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} mt-2`}
              disabled={loading}
              required
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor={loginPasswordId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Password
            </label>
            <input
              id={loginPasswordId}
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
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

          <p className="mt-4 text-center font-[family-name:var(--font-outfit)] text-xs text-white/45">
            New here?{" "}
            <Link href={TERMS_NEXT} className="text-[#F0BA19]/85 underline-offset-2 hover:underline">
              Read the demo terms
            </Link>{" "}
            before creating an account.
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit} className="mt-6 text-left">
          <div>
            <label
              htmlFor={signupEmailId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Email
            </label>
            <input
              id={signupEmailId}
              name="email"
              type="email"
              autoComplete="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} mt-2`}
              disabled={loading}
              required
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor={signupPasswordId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Password
            </label>
            <input
              id={signupPasswordId}
              name="password"
              type="password"
              autoComplete="new-password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`${inputClass} mt-2`}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor={signupConfirmId}
              className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
            >
              Confirm password
            </label>
            <input
              id={signupConfirmId}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              placeholder="Repeat password"
              className={`${inputClass} mt-2`}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          <p className="mt-4 font-[family-name:var(--font-outfit)] text-xs text-white/45">
            By creating an account you accept the demo terms above and the HAMS{" "}
            <code className="text-white/55">terms_version</code> for this environment.{" "}
            <Link href={TERMS_NEXT} className="text-[#F0BA19]/80 hover:underline">
              Review terms again
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold tracking-wide text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 hover:shadow-[0_0_20px_rgba(240,186,25,0.35)] disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
