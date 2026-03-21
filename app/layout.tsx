import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hollowed Oath — registration demo",
    template: "%s | Hollowed Oath demo",
  },
  description:
    "Temp registration demo: log in to this site, then view your account on /signedin.",
  openGraph: {
    title: "Hollowed Oath — registration demo",
    description:
      "Sign in or create an account for Hollowed Oath.",
    images: [
      {
        url: "https://hollowedoath.com/videos/hero-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Hollowed Oath",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${cinzel.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
