import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: {
    default: "Chimee Lagos | Luxury Phones & Laptops",
    template: "%s | Chimee Lagos",
  },
  description: "Lagos' most curated showroom for premium pre-owned phones, laptops, and accessories. UK verified devices with same-day delivery.",
  keywords: ["luxury phones Lagos", "UK used phones Nigeria", "pre-owned laptops Lagos", "iPhone Lagos", "MacBook Lagos", "premium electronics Nigeria"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.chimee.ng"),
  openGraph: {
    title: "Chimee Lagos | Luxury Phones & Laptops",
    description: "Lagos' most curated showroom for premium pre-owned phones, laptops, and accessories.",
    siteName: "Chimee Lagos",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chimee Lagos | Luxury Phones & Laptops",
    description: "Premium curated electronics in Lagos. UK verified, same-day delivery.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientWrapper>{children}</ClientWrapper>
        <Analytics />
      </body>
    </html>
  );
}
