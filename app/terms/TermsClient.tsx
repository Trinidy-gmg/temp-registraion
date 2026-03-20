"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { setTermsScrollAck } from "@/lib/terms-ack";

const LOREM_SECTIONS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper.",
  "Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi.",
  "Maecenas sed diam eget risus varius blandit sit amet non magna. Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Nullam quis risus eget urna mollis ornare vel eu leo.",
  "Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
  "Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Aenean lacinia bibendum nulla sed consectetur. Etiam porta sem malesuada magna mollis euismod. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh.",
  "Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
  "Sed posuere consectetur est at lobortis. Nullam id dolor id nibh ultricies vehicula ut id elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.",
  "Etiam porta sem malesuada magna mollis euismod. Cras mattis consectetur purus sit amet fermentum. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Nullam id dolor id nibh ultricies vehicula ut id elit.",
  "Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vestibulum id ligula porta felis euismod semper.",
  "Cras mattis consectetur purus sit amet fermentum. Sed posuere consectetur est at lobortis. Maecenas faucibus mollis interdum. Aenean lacinia bibendum nulla sed consectetur. Donec id elit non mi porta gravida at eget metus.",
  "Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Nullam quis risus eget urna mollis ornare vel eu leo. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.",
  "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Curabitur blandit tempus porttitor. Maecenas sed diam eget risus varius blandit sit amet non magna.",
];

export function TermsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/?signup=1";

  const [atBottom, setAtBottom] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(el.scrollHeight, body.scrollHeight);
    const scrollTop = el.scrollTop || body.scrollTop;
    const clientHeight = el.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setAtBottom(distanceFromBottom <= 72);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function handleContinue() {
    if (!atBottom) return;
    setTermsScrollAck();
    const safe =
      nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/?signup=1";
    router.push(safe);
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-[hsl(30_8%_10%)] to-[hsl(30_8%_6%)] pb-36 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10 md:py-14">
        <Link
          href="/"
          className="font-[family-name:var(--font-outfit)] text-sm text-[#F0BA19]/90 underline-offset-2 hover:underline"
        >
          ← Back to sign in
        </Link>

        <h1 className="mt-8 font-[family-name:var(--font-cinzel)] text-3xl font-bold tracking-tight text-[#F0BA19] drop-shadow-[0_0_12px_rgba(240,186,25,0.25)] md:text-4xl">
          Demo terms & conditions
        </h1>
        <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-white/65">
          This is placeholder text for UI testing only. Scroll to the bottom to continue
          to account creation.
        </p>

        <article className="mt-10 space-y-6 rounded-xl border border-[#F0BA19]/25 bg-black/25 p-6 md:p-8">
          {LOREM_SECTIONS.map((text, i) => (
            <p
              key={i}
              className="font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/80 md:text-base"
            >
              <span className="font-semibold text-[#F0BA19]/80">{i + 1}. </span>
              {text}
            </p>
          ))}
          <p className="border-t border-[#F0BA19]/20 pt-6 font-[family-name:var(--font-outfit)] text-sm font-medium text-[#F0BA19]">
            — End of demo terms —
          </p>
        </article>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#F0BA19]/30 bg-[hsl(30_8%_8%_/_0.95)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-outfit)] text-xs text-white/55 sm:text-sm">
            {atBottom ? (
              <span className="text-emerald-300/90">You’ve reached the bottom.</span>
            ) : (
              <span>Scroll to the bottom to unlock “Continue to create account”.</span>
            )}
          </p>
          <button
            type="button"
            disabled={!atBottom}
            onClick={handleContinue}
            className="shrink-0 rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#F0BA19]/15"
          >
            Continue to create account
          </button>
        </div>
      </div>
    </div>
  );
}
