"use client";

import { useEffect, useId, useState } from "react";

const KMSI_STORAGE_KEY = "ho-keep-me-signed-in";

export function LoginPanel() {
  const usernameId = useId();
  const passwordId = useId();
  const kmsiId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(false);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Login flow wired later — UI only for now
  }

  const inputClass =
    "w-full rounded-md border border-[#F0BA19]/25 bg-black/40 px-3.5 py-2.5 font-[family-name:var(--font-outfit)] text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#F0BA19]/70 focus:ring-2 focus:ring-[#F0BA19]/25";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8"
    >
      <div className="text-left">
        <label
          htmlFor={usernameId}
          className="block font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-[#F0BA19]/90"
        >
          Username
        </label>
        <input
          id={usernameId}
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className={`${inputClass} mt-2`}
        />
      </div>

      <div className="mt-5 text-left">
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
          placeholder="Enter your password"
          className={`${inputClass} mt-2`}
        />
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-3 select-none">
        <input
          id={kmsiId}
          type="checkbox"
          checked={keepMeSignedIn}
          onChange={(e) => handleKmsiChange(e.target.checked)}
          className="peer sr-only"
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
        className="mt-8 w-full rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold tracking-wide text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 hover:shadow-[0_0_20px_rgba(240,186,25,0.35)]"
      >
        Sign in
      </button>

      <p className="mt-4 text-center font-[family-name:var(--font-outfit)] text-xs text-white/40">
        Account linking and authentication will connect here in a future update.
      </p>
    </form>
  );
}
