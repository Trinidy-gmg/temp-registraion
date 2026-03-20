/**
 * Decode JWT payload (middle segment) without verifying the signature.
 * Used only to read `sub` / `email` for UI on this demo site — not for authorization.
 * Real API authorization must validate the token with HAMS or a shared public key.
 */

export function decodeJwtPayloadUnsafe(
  jwt: string
): Record<string, unknown> | null {
  const trimmed = jwt.trim();
  const parts = trimmed.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const obj = JSON.parse(json) as unknown;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return obj as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
