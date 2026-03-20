"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { TermsLoremArticle } from "@/app/components/TermsLoremArticle";
import { useScrollNearBottom } from "@/hooks/use-scroll-near-bottom";
import { hasTermsScrollAck, setTermsScrollAck } from "@/lib/terms-ack";

const TOTAL_STEPS = 4;

const inputClass =
  "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

export function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTerms =
    searchParams.get("from") === "terms" && hasTermsScrollAck();

  const [step, setStep] = useState(1);
  const [termsOkThisSession, setTermsOkThisSession] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const kmsiId = useId();

  useEffect(() => {
    if (fromTerms) {
      setStep(3);
      setTermsOkThisSession(true);
    }
  }, [fromTerms]);

  /** Fresh scroll for terms so step-1 position doesn’t unlock continue. */
  useEffect(() => {
    if (step === 2) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [step]);

  const canAccessAccountStep = termsOkThisSession || fromTerms;

  const goToStep = useCallback(
    (next: number) => {
      setError(null);
      if (next === 3 && !termsOkThisSession && !fromTerms) {
        setError("Complete the terms step first.");
        return;
      }
      if (next < 3) {
        setTermsOkThisSession(false);
      }
      setStep(next);
    },
    [termsOkThisSession, fromTerms]
  );

  const atBottomDoc = useScrollNearBottom(72);
  const atBottomTerms = step === 2 && atBottomDoc;

  function completeTermsStep() {
    if (!atBottomTerms) return;
    setTermsScrollAck();
    setTermsOkThisSession(true);
    setStep(3);
  }

  async function doLogin(email: string, password: string, kmsi: boolean) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password, keepMeSignedIn: kmsi }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Sign in failed (${res.status})`);
    }
    return data as { ok: true; account_id: string };
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canAccessAccountStep) {
      setError("Please complete the terms step before entering account details.");
      setStep(2);
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
        await doLogin(email, signupPassword, keepMeSignedIn);
        setCreatedAccountId(accountId);
        setStep(4);
        setSignupPassword("");
        setSignupConfirm("");
      } catch (loginErr) {
        setCreatedAccountId(accountId);
        setStep(4);
        setError(
          loginErr instanceof Error
            ? `Account created, but automatic sign-in failed: ${loginErr.message}. You can sign in from the home page.`
            : "Account created, but automatic sign-in failed."
        );
        setSignupPassword("");
        setSignupConfirm("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function stepLabel(n: number): string {
    switch (n) {
      case 1:
        return "Start";
      case 2:
        return "Terms";
      case 3:
        return "Account";
      case 4:
        return "Done";
      default:
        return "";
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                step >= n
                  ? "border-[#F0BA19] bg-[#F0BA19]/20 text-[#F0BA19]"
                  : "border-white/20 bg-black/30 text-white/40"
              }`}
            >
              {n}
            </div>
            <span className="hidden text-[10px] uppercase tracking-wider text-white/45 sm:block">
              {stepLabel(n)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8">
        {error ? (
          <p
            className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-left font-[family-name:var(--font-outfit)] text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {step === 1 && (
          <div className="text-left">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
              Welcome, Oathsworn
            </h2>
            <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/70">
              You’re about to create your Hollowed Oath account — your identity for the
              realm. Continue when you’re ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25"
              >
                Continue
              </button>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-white/20 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/75 hover:bg-white/5"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-left">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-[#F0BA19]">
              Demo terms
            </h2>
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-sm text-white/65">
              Placeholder text only. Scroll the page to the bottom to continue.
            </p>
            <div className="mt-6">
              <TermsLoremArticle />
            </div>
            <p className="mt-4 font-[family-name:var(--font-outfit)] text-xs text-white/45">
              Tip: scroll the main page until you reach the end of the terms below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!atBottomTerms}
                onClick={completeTermsStep}
                className="rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                I’ve read to the end — continue
              </button>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="rounded-md border border-white/20 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/70 hover:bg-white/5"
              >
                Back
              </button>
            </div>
            {!atBottomTerms ? (
              <p className="mt-3 font-[family-name:var(--font-outfit)] text-xs text-amber-200/80">
                Scroll the terms to the bottom to enable continue.
              </p>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleCreateAccount} className="text-left">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-white">
              Your account
            </h2>
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-sm text-white/60">
              Enter the email and password you want to use. Minimum 8 characters.
            </p>

            <div className="mt-6">
              <label
                htmlFor={emailId}
                className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
              >
                Email
              </label>
              <input
                id={emailId}
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
                htmlFor={passwordId}
                className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
              >
                Password
              </label>
              <input
                id={passwordId}
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
                htmlFor={confirmId}
                className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
              >
                Confirm password
              </label>
              <input
                id={confirmId}
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

            <label className="mt-6 flex cursor-pointer items-center gap-3 select-none">
              <input
                id={kmsiId}
                type="checkbox"
                checked={keepMeSignedIn}
                onChange={(e) => setKeepMeSignedIn(e.target.checked)}
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
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </span>
              <span className="font-[family-name:var(--font-outfit)] text-sm text-white/85">
                Keep me signed in after account is created
              </span>
            </label>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create account & continue"}
              </button>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="rounded-md border border-white/20 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/70 hover:bg-white/5"
              >
                Back to terms
              </button>
            </div>
          </form>
        )}

        {step === 4 && createdAccountId && (
          <div className="text-left">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-emerald-200">
              You’re set
            </h2>
            <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-white/75">
              Your account ID (HRID):{" "}
              <span className="font-mono text-[#F0BA19]">{createdAccountId}</span>
            </p>
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-sm text-white/55">
              If sign-in cookies were set, you’re logged in on this device. You can always
              return to the home page to sign in again.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] hover:bg-[#F0BA19]/25"
              >
                Go to sign in
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCreatedAccountId(null);
                  setTermsOkThisSession(false);
                  setSignupEmail("");
                  setError(null);
                  router.push("/signup");
                }}
                className="rounded-md border border-white/20 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/70 hover:bg-white/5"
              >
                Register another (demo)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
