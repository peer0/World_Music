import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Music — 편지의 세계",
  description: "노래에서 느끼는 세계를 편지로 쓰면, AI가 3D 세계로 만들어줍니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
