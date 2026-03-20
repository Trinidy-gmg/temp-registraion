import { TERMS_LOREM_SECTIONS } from "@/lib/terms-lorem";

export function TermsLoremArticle() {
  return (
    <article className="space-y-6 rounded-xl border border-[#F0BA19]/25 bg-black/25 p-6 md:p-8">
      {TERMS_LOREM_SECTIONS.map((text, i) => (
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
  );
}
