import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Atoms",
  description: "AI agent app builder with streamed generation and Sandpack preview"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
