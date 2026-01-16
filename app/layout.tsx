import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工單系統 Demo",
  description: "Reqsys dashboard demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
