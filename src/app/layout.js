import { Inter } from "next/font/google";
import "./globals.css";

/**
 * ROOT LAYOUT
 * ===========
 * This is the top-level wrapper for every page in Next.js.
 * 
 * WHAT IT DOES:
 * 1. Loads the Inter font from Google Fonts (modern, clean, professional)
 * 2. Sets the <html> lang and class attributes
 * 3. Wraps children in <body> so every page inherits these settings
 * 4. Sets the page metadata (title, description) for SEO
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "AtomSync | Modern Goal Tracking",
  description: "Organizational goal tracking and alignment platform built for the AtomQuest Hackathon.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body style={{ fontFamily: "var(--font-sans)" }}>{children}</body>
    </html>
  );
}
