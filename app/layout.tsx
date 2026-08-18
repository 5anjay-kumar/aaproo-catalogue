import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { MixpanelInit } from "@/components/MixpanelInit";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

// Self-hosted at build time (no runtime request to Google's CDN, no render-blocking
// stylesheet fetch, no flash of unstyled text).
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aaproo Catalogue",
  description: "Browse Aaproo products and download images for marketing.",
  robots: { index: false, follow: false }, // internal tool — keep it out of search engines
};

export const viewport: Viewport = {
  themeColor: "#F7F5F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <MixpanelInit />
      </body>
    </html>
  );
}
