import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TvoiKent Face MVP",
  description: "Mistral + fuzzy logic face generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}