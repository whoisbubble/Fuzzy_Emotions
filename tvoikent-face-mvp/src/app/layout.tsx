import type { Metadata } from "next";
import { IBM_Plex_Mono, Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  variable: "--font-rubik",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fuzzyemotions.bostoncrew.ru"),
  title: "fuzzyemotions.bostoncrew.ru",
  description: "FuzzyEmotions: Mistral + fuzzy logic + expressive SVG face synthesis",
  applicationName: "fuzzyemotions.bostoncrew.ru",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/icon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${rubik.variable} ${ibmPlexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
