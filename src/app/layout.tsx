import type { Metadata } from "next";
import { Noto_Serif, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kitô giáo Tỉnh thức: Thế giới - Bản ngã - Từ bi",
  description:
    "Khám phá Kitô giáo chiêm niệm qua lăng kính tỉnh thức. " +
    "Một không gian suy tư về thế giới, bản ngã, và từ bi " +
    "theo tinh thần các nhà hướng dẫn tâm linh đương đại.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${notoSerif.variable} ${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
