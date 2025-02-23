import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import BottomNav from "@/components/common/BottomNav";
import Providers from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "GifTalk - インフルエンサーとチャット",
  description: "インフルエンサーとリアルタイムにチャットできるサービスです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <BottomNav />
          <footer className="py-4 text-center text-sm text-gray-500 bg-white border-t border-gray-200">
            Copyright © 2025 GifTalk
          </footer>
        </Providers>
      </body>
    </html>
  );
}