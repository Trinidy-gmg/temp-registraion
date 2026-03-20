import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
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
  title: "Hollowed Oath — Sign in",
  description:
    "Sign in to Hollowed Oath — a heroic fantasy MMORPG from God Mode Games.",
  openGraph: {
    title: "Hollowed Oath — Sign in",
    description:
      "Welcome back, Oathsworn. Sign in to Hollowed Oath.",
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
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
