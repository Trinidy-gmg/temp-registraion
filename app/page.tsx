import { HeroBackdrop } from "./components/HeroBackdrop";
import { SignInForm } from "./components/SignInForm";

export default function Home() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Welcome
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          Sign in with your Hollowed Oath account. New players can start registration from
          the link below — you’ll review demo terms, then create your credentials.
        </p>

        <div className="mt-8 flex w-full justify-center">
          <SignInForm />
        </div>
      </main>
    </HeroBackdrop>
  );
}
