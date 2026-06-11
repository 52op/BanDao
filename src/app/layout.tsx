import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/unlock/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "办到 - 免费在线办公工具",
  description:
    "免费在线办公工具箱，提供 PDF 拆分、图片压缩、文本去重、隐私水印等实用工具，所有操作均在浏览器本地完成，安全无忧。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
