import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Music",
  description: "Transform your letters about songs into immersive 3D worlds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
