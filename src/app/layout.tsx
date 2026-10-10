import type { Metadata, Viewport } from "next";
import { GAME_NAME, tr } from "@/content/tr";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: tr.meta.title,
  description: tr.meta.description,
  openGraph: {
    title: tr.meta.title,
    description: tr.meta.description,
    siteName: GAME_NAME,
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: tr.meta.title,
    description: tr.meta.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#b0405c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="fixed inset-0 overflow-hidden">{children}</body>
    </html>
  );
}
