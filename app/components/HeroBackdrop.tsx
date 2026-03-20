import Image from "next/image";

const HERO_POSTER = "https://hollowedoath.com/videos/hero-poster.jpg";

export function HeroBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_POSTER}
          alt="Hollowed Oath — heroic fantasy MMORPG"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-[hsl(30_8%_8%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[hsl(30_8%_8%)] via-transparent to-transparent opacity-90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(30_8%_8%_/_0.65)_100%)]"
          aria-hidden
        />
      </div>
      {children}
    </div>
  );
}
