import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalkStake - Monetize Expert Knowledge",
  description: "A decentralized discussion platform that monetizes expert knowledge through staked conversations with KDA and PYUSD.",
  keywords: ["DeFi", "Kadena", "PYUSD", "Staking", "Expert Knowledge", "Web3"],
  authors: [{ name: "TalkStake Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <WalletProvider>
          <div className="gradient-bg min-h-screen">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
