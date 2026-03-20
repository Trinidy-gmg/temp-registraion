"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * True when the document is scrolled within `thresholdPx` of the bottom.
 */
export function useScrollNearBottom(thresholdPx = 72): boolean {
  const [atBottom, setAtBottom] = useState(false);

  const update = useCallback(() => {
    const el = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(el.scrollHeight, body.scrollHeight);
    const scrollTop = el.scrollTop || body.scrollTop;
    const clientHeight = el.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setAtBottom(distanceFromBottom <= thresholdPx);
  }, [thresholdPx]);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return atBottom;
}
