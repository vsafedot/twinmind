// Made by SIDDHARTH NAIN
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TwinMind — Live AI Meeting Copilot",
  description: "Real-time AI meeting assistant that listens, transcribes, and surfaces intelligent suggestions as you speak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable + " h-full antialiased"} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
