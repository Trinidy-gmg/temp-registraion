/**
 * Signed httpOnly cookie for pending email verification (8-digit code).
 * Server-only — uses SIGNUP_VERIFY_SECRET.
 */

import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

export const EMAIL_VERIFY_COOKIE = "ho_email_verify";

export type EmailVerifyPayload = {
  v: 1;
  /** Account HRID */
  aid: string;
  email: string;
  /** sha256 hex of code */
  ch: string;
  exp: number;
};

function getSecret(): string {
  const s = process.env.SIGNUP_VERIFY_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("SIGNUP_VERIFY_SECRET must be set (min 16 characters)");
  }
  return s;
}

function signB64Payload(b64: string): string {
  return createHmac("sha256", getSecret()).update(b64).digest("hex");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export function hashVerificationCode(accountId: string, code: string): string {
  const normalized = code.replace(/\s/g, "");
  return createHash("sha256")
    .update(`${accountId}|${normalized}|${getSecret()}`)
    .digest("hex");
}

export function generateEightDigitCode(): string {
  return String(randomInt(0, 100_000_000)).padStart(8, "0");
}

export function sealEmailVerifyPayload(payload: EmailVerifyPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const sig = signB64Payload(b64);
  return `${b64}.${sig}`;
}

export function openEmailVerifyToken(token: string): EmailVerifyPayload | null {
  const last = token.lastIndexOf(".");
  if (last <= 0) return null;
  const b64 = token.slice(0, last);
  const sig = token.slice(last + 1);
  const expectedSig = signB64Payload(b64);
  if (!timingSafeEqualStr(sig, expectedSig)) return null;
  try {
    const raw = JSON.parse(
      Buffer.from(b64, "base64url").toString("utf8")
    ) as EmailVerifyPayload;
    if (raw.v !== 1 || typeof raw.aid !== "string" || typeof raw.ch !== "string") {
      return null;
    }
    if (typeof raw.email !== "string" || typeof raw.exp !== "number") {
      return null;
    }
    if (raw.exp < Date.now()) return null;
    return raw;
  } catch {
    return null;
  }
}

export function buildEmailVerifyPayload(
  accountId: string,
  email: string,
  code: string,
  ttlMs: number
): EmailVerifyPayload {
  const exp = Date.now() + ttlMs;
  const ch = hashVerificationCode(accountId, code);
  return { v: 1, aid: accountId, email: email.trim(), ch, exp };
}

export function codeMatchesPayload(
  payload: EmailVerifyPayload,
  code: string
): boolean {
  const h = hashVerificationCode(payload.aid, code);
  return timingSafeEqualStr(h, payload.ch);
}

export function getVerificationTtlMs(): number {
  const raw = process.env.SIGNUP_VERIFY_CODE_TTL_MS;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n > 60_000 && n < 24 * 60 * 60 * 1000) {
    return n;
  }
  return 15 * 60 * 1000;
}

/** True when cookie signing secret is usable (min 16 chars). */
export function isSignupVerifySecretConfigured(): boolean {
  const s = process.env.SIGNUP_VERIFY_SECRET?.trim();
  return Boolean(s && s.length >= 16);
}

/** New signed cookie value + plaintext code for emailing (never send code to browser). */
export function issueNewVerificationSession(
  accountId: string,
  email: string
): { token: string; code: string; maxAgeSec: number } {
  const code = generateEightDigitCode();
  const ttl = getVerificationTtlMs();
  const payload = buildEmailVerifyPayload(accountId, email, code, ttl);
  const token = sealEmailVerifyPayload(payload);
  return { token, code, maxAgeSec: Math.ceil(ttl / 1000) };
}

export function verificationCookieOptions(maxAgeSec: number): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  };
}
