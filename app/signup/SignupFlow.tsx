"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { TermsLoremArticle } from "@/app/components/TermsLoremArticle";
import { useScrollNearBottom } from "@/hooks/use-scroll-near-bottom";
import { fetchLoginAfterVerification } from "@/lib/client-login-after-verify";
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
  const [verifyCode, setVerifyCode] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Non-blocking issues on the verify step (e.g. SendGrid), not “sign-in failed”. */
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const kmsiId = useId();
  const verifyCodeId = useId();

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
        cache: "no-store",
        body: JSON.stringify({ email, password: signupPassword }),
      });
      const regData = (await regRes.json().catch(() => ({}))) as {
        error?: string;
        account_id?: string;
        verification_required?: boolean;
        verification_email_sent?: boolean;
        verification_email_error?: string;
      };
      if (!regRes.ok) {
        throw new Error(regData.error || `Registration failed (${regRes.status})`);
      }
      const accountId = regData.account_id as string;
      if (!accountId) {
        throw new Error("Registration succeeded but no account id was returned.");
      }
      // New flow never logs in here — old deployments only return { account_id } without this flag.
      if (regData.verification_required !== true) {
        setError(
          "Your account may have been created, but we couldn't start email verification. Please try signing in — you may be able to request a new verification code from the sign-in page."
        );
        setCreatedAccountId(accountId);
        setVerifyNotice(null);
        setSignupConfirm("");
        return;
      }
      setCreatedAccountId(accountId);
      setVerifyCode("");
      setStep(4);
      setError(null);
      if (regData.verification_email_sent === false) {
        setVerifyNotice(
          (regData.verification_email_error as string | undefined) ||
            "We created your account, but the verification email couldn't be sent. Tap “Resend code” below, or try again in a few minutes."
        );
      } else {
        setVerifyNotice(null);
      }
      setSignupConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setVerifyNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verification/resend", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Could not resend (${res.status})`);
      }
      setVerifyNotice("A new code was sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmVerification(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = verifyCode.replace(/\s/g, "");
    if (!/^\d{8}$/.test(code)) {
      setError("Enter the 8-digit code from your email.");
      return;
    }
    if (!signupPassword) {
      setError("Your password is required to finish verification. Go back to account details or log in from /login.");
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
      const email = signupEmail.trim();
      const password = signupPassword;
      const login = await fetchLoginAfterVerification({
        email,
        password,
        keepMeSignedIn,
      });
      if (!login.ok) {
        throw new Error(
          login.message ||
            "Email verified, but sign-in failed. Try signing in from the home page."
        );
      }
      setSignupPassword("");
      setSignupConfirm("");
      setVerifyCode("");
      router.replace("/signedin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
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
        return "Verify";
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
                href="/login"
                className="inline-flex items-center rounded-md border border-white/20 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/75 hover:bg-white/5"
              >
                Back to log in
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
                Keep me signed in after verification
              </span>
            </label>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create account"}
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
          <form onSubmit={handleConfirmVerification} className="text-left">
            <h2 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-[#F0BA19]">
              Verify your email
            </h2>
            {verifyNotice ? (
              <p
                className="mt-3 rounded-md border border-amber-500/35 bg-amber-950/30 px-3 py-2 font-[family-name:var(--font-outfit)] text-sm text-amber-100/95"
                role="status"
              >
                {verifyNotice}
              </p>
            ) : null}
            <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-white/75">
              We sent an <span className="text-white/90">8-digit code</span> to{" "}
              <span className="text-[#F0BA19]/90">{signupEmail}</span>. Enter it below to
              activate your account. You’ll be signed in automatically.
            </p>
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-xs text-white/45">
              Account ID:{" "}
              <span className="font-mono text-[#F0BA19]/80">{createdAccountId}</span>
            </p>

            <div className="mt-6">
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
                pattern="[0-9]*"
                maxLength={12}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="12345678"
                className={`${inputClass} mt-2 font-mono tracking-widest`}
                disabled={loading}
                required
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] transition hover:bg-[#F0BA19]/25 disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleResendCode()}
                className="rounded-md border border-white/25 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/75 hover:bg-white/5 disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  setVerifyCode("");
                  setError(null);
                  setVerifyNotice(null);
                }}
                className="rounded-md border border-white/20 px-4 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white/70 hover:bg-white/5"
              >
                Back
              </button>
            </div>
            <p className="mt-4 font-[family-name:var(--font-outfit)] text-xs text-white/40">
              Left this page? Log in from <code className="text-white/50">/login</code> with your
              email and password — you’ll be able to send a new code if you still need to verify.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
