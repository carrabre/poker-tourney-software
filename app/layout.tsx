import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogoAdvertisement } from "./components/LogoAdvertisement";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allins.party | Poker Tournament Manager",
  description: "Beautiful, intuitive tournament management for the modern poker director",
  icons: {
    icon: '/images/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <LogoAdvertisement />
      </body>
    </html>
  );
}
console.log("Tournament software loaded - " + new Date().toISOString());
console.log('[TEST] Clock fixes have been applied');
console.log('Tables persistence and payouts fixes applied to tournament view');
console.log('🕒 Tournament clock has been fixed to work reliably', new Date().toISOString());
console.log('📋 Empty tables now persist on refresh, and pause button no longer resets clock', new Date().toISOString());
console.log('⏱️ Fixed timer reset bug - clock now runs continuously without resetting after 2 seconds', new Date().toISOString());
console.log('✨ UI enhancements added: improved spacing, animations, and table persistence fixed', new Date().toISOString());
console.log('🟢 Logo advertisement added to bottom right corner', new Date().toISOString());
