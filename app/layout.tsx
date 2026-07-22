import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fraction Games for Kids – 240 Free Maths Levels | GameBosh",
  description: "Play free fraction games for kids with 240 levels and 1,200+ questions. Learn fraction basics, equivalent fractions, comparing, adding, subtracting, multiplying, dividing and mixed numbers.",
  keywords: ["fraction games", "fractions for kids", "math games", "fraction learning game", "free educational games", "equivalent fractions", "adding fractions", "GameBosh"],
  authors: [{ name: "GameBosh", url: "https://gamebosh.com/" }],
  creator: "GameBosh",
  publisher: "GameBosh",
  openGraph: {
    title: "GameBosh Fraction Quest – Free Fraction Games for Kids",
    description: "A colourful maths adventure with 240 levels, visual models and friendly step-by-step explanations.",
    type: "website",
    images: [{ url: "https://gamebosh.github.io/Fractions-game/gamebosh-kids-banner.webp", width: 1024, height: 500, alt: "GameBosh Fraction Quest" }],
  },
  twitter: { card: "summary_large_image", title: "GameBosh Fraction Quest", description: "Free fraction games for kids with 1,200+ challenges.", images: ["https://gamebosh.github.io/Fractions-game/gamebosh-kids-banner.webp"] },
  robots: { index: true, follow: true },
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  name: "GameBosh Fraction Quest",
  description: "A free interactive fraction learning game for children with 240 levels and more than 1,200 challenges.",
  educationalLevel: "Primary and middle school",
  learningResourceType: "Educational game",
  teaches: ["Fraction basics", "Equivalent fractions", "Comparing fractions", "Adding fractions", "Subtracting fractions", "Multiplying fractions", "Dividing fractions", "Mixed numbers"],
  isAccessibleForFree: true,
  inLanguage: "en",
  provider: { "@type": "Organization", name: "GameBosh", url: "https://gamebosh.com/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
