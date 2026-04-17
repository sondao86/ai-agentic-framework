import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitô giáo Tỉnh thức — API",
  description: "Backend API server",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
