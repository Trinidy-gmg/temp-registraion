/**
 * Client-only: user must scroll through /terms before signup fields are used.
 * Version suffix allows resetting the gate if terms change.
 */
export const TERMS_SCROLL_ACK_KEY = "ho_terms_scroll_ack_v1";

export function hasTermsScrollAck(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TERMS_SCROLL_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTermsScrollAck(): void {
  try {
    window.localStorage.setItem(TERMS_SCROLL_ACK_KEY, "1");
  } catch {
    /* ignore */
  }
}
