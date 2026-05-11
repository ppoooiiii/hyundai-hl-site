import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "현대차 · Hyperliquid × Upbit",
  description: "Hyperliquid HYUNDAI 가격을 Upbit USDT/KRW로 환산한 현대차 24시간 참고 가격"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
