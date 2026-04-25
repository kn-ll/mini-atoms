import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Atoms",
  description: "支持流式生成与 Sandpack 预览的 AI 智能体应用构建器"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
