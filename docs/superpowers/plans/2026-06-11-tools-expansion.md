# 工具站扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构分类体系、加入分组 UI 和 Ctrl+K 搜索、新增 3 个工具（二维码、JSON 格式化、Markdown 预览）

**Architecture:** 分类重组驱动 registry → sidebar/homepage 联动分组渲染 → cmdk 实现全局搜索 → 3 个独立工具模块各自自包含

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, cmdk, qrcode, react-markdown, remark-gfm, JSZip

---

## 文件结构总览

```
修改:
  src/tools/registry.ts              # 分类类型 + 新工具注册
  src/tools/watermark/index.tsx      # category: privacy → image
  src/tools/text-cleaner/index.tsx   # category: text → developer (不改代码，仅 registry 映射)
  src/components/layout/sidebar.tsx  # 分组渲染
  src/components/layout/header.tsx   # 搜索按钮
  src/app/page.tsx                   # 分组卡片
  src/app/layout.tsx                 # metadata 更新
  开发必看.md                        # 文档更新

创建:
  src/components/command-menu.tsx     # Ctrl+K 搜索弹窗
  src/tools/qr-code/index.tsx        # 二维码生成器
  src/tools/json-formatter/index.tsx # JSON 格式化
  src/tools/markdown-preview/index.tsx # Markdown 预览
```

---

## Task 1: 安装依赖

- [ ] **Step 1: 安装所有新依赖**

```bash
npm install cmdk qrcode react-markdown remark-gfm
npm install -D @types/qrcode
```

- [ ] **Step 2: 验证安装成功**

```bash
npm ls cmdk qrcode react-markdown remark-gfm
```

Expected: 每个包都有版本号输出，无 ERRORS

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "deps: 添加 cmdk, qrcode, react-markdown, remark-gfm"
```

---

## Task 2: 分类重组 — registry.ts

- [ ] **Step 1: 修改 ToolCategory 类型和 categoryLabels**

修改 `src/tools/registry.ts`，将类型和映射替换：

```ts
export type ToolCategory = "document" | "image" | "developer" | "utility";

export const categoryLabels: Record<ToolCategory, string> = {
  document: "文档工具",
  image: "图片处理",
  developer: "开发工具",
  utility: "实用工具",
};
```

- [ ] **Step 2: 更新现有工具的 category 字段**

在同一文件中，修改现有工具：

| 工具 slug | 旧 category | 新 category |
|-----------|------------|------------|
| pdf-split | `pdf` | `document` |
| image-compress | `image` | `image`（不变） |
| text-cleaner | `text` | `developer` |
| watermark | `privacy` | `image` |
| svg-convert | `image` | `image`（不变） |

对应代码修改：

```ts
// pdf-split: category: "pdf" → "document"
{ slug: "pdf-split", ..., category: "document" }

// text-cleaner: category: "text" → "developer"
{ slug: "text-cleaner", ..., category: "developer" }

// watermark: category: "privacy" → "image"
{ slug: "watermark", ..., category: "image" }
```

- [ ] **Step 3: 添加 3 个新工具注册条目**

在 `tools` 数组末尾追加：

```ts
import {
  FileText, Image, FileEdit, Shield, FileImage,
  QrCode, Code2, FileCode,
  type LucideIcon,
} from "lucide-react";
```

注意：`QrCode`、`Code2`、`FileCode` 是 lucide-react 中的图标。如果 `QrCode` 不存在，用 `QrCode` 或 `ScanBarcode`。先检查 lucide-react 是否有这些图标，若没有则用最接近的替代（如 `二维码` 可用 `QrCode`，JSON 可用 `Code2` 或 `Braces`，Markdown 可用 `FileCode`）。

追加注册条目：

```ts
{
  slug: "qr-code",
  name: "二维码生成器",
  description: "文本、链接转二维码，支持批量下载",
  icon: QrCode,
  category: "utility",
  component: lazy(() => import("./qr-code")),
},
{
  slug: "json-formatter",
  name: "JSON 格式化",
  description: "格式化、压缩、语法检查",
  icon: Code2,
  category: "developer",
  component: lazy(() => import("./json-formatter")),
},
{
  slug: "markdown-preview",
  name: "Markdown 预览",
  description: "实时预览 Markdown，支持导出 HTML",
  icon: FileCode,
  category: "document",
  component: lazy(() => import("./markdown-preview")),
},
```

- [ ] **Step 4: 验证构建**

```bash
npx next build 2>&1 | cat
```

Expected: `✓ Compiled successfully`，无 TypeScript 错误

- [ ] **Step 5: 提交**

```bash
git add src/tools/registry.ts
git commit -m "refactor: 重组分类体系，新增 document/developer/utility 分类"
```

---

## Task 3: Sidebar 分组渲染

- [ ] **Step 1: 重写 sidebar.tsx**

修改 `src/components/layout/sidebar.tsx`，按分类分组渲染：

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools, categoryLabels, type ToolCategory } from "@/tools/registry";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const categoryOrder: ToolCategory[] = ["document", "image", "developer", "utility"];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-56 bg-sidebar text-sidebar-foreground border-r border-border/50 shrink-0",
        className
      )}
    >
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-7 rounded-lg bg-foreground text-background text-xs font-bold font-mono">
            B
          </span>
          <span className="font-semibold text-base">办到</span>
        </Link>
      </div>

      <Separator className="opacity-40" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {categoryOrder.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          if (catTools.length === 0) return null;
          return (
            <div key={cat} className="mb-3">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                {categoryLabels[cat]}
              </p>
              <ul className="space-y-0.5">
                {catTools.map((tool) => {
                  const href = `/tools/${tool.slug}`;
                  const isActive = pathname === href;
                  const Icon = tool.icon;
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-sidebar-accent text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-60" />
                        {tool.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground/50 leading-relaxed">
          关注公众号获取高级功能
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
npx next build 2>&1 | cat
```

Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: sidebar 按分类分组显示"
```

---

## Task 4: 首页分组渲染

- [ ] **Step 1: 重写 page.tsx**

修改 `src/app/page.tsx`，按分类分组展示卡片：

```tsx
"use client";

import Link from "next/link";
import { tools, categoryLabels, type ToolCategory } from "@/tools/registry";
import { Shield } from "lucide-react";

const categoryOrder: ToolCategory[] = ["document", "image", "developer", "utility"];

export default function Home() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        <h1 className="font-heading text-5xl sm:text-6xl md:text-[4.5rem] font-bold tracking-tight leading-tight animate-fade-in-up">
          办到 · 即用即走
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-in-up stagger-1">
          所有工具均在浏览器本地完成处理，您的文件绝不会上传到任何服务器
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground/60 animate-fade-in-up stagger-2">
          <Shield className="h-4 w-4" />
          无需注册 · 不上传服务器 · 完全免费
        </div>
      </section>

      {/* Tool Cards grouped by category */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full space-y-10">
        {categoryOrder.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          if (catTools.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 px-1">
                {categoryLabels[cat]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {catTools.map((tool, i) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                      <div className="group relative flex flex-col gap-3 p-6 rounded-xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 cursor-pointer h-full">
                        <div className="p-2.5 rounded-lg bg-muted/50 w-fit">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        <span className="text-muted-foreground/40 text-sm transition-colors group-hover:text-foreground/60 mt-1">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground/50 border-t border-border/40">
        办到 · 所有工具纯前端本地运行，不收集任何用户数据
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
npx next build 2>&1 | cat
```

Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/app/page.tsx
git commit -m "feat: 首页工具卡片按分类分组展示"
```

---

## Task 5: Ctrl+K 搜索 — CommandMenu 组件

- [ ] **Step 1: 创建 command-menu.tsx**

创建 `src/components/command-menu.tsx`：

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { tools, categoryLabels, type ToolCategory } from "@/tools/registry";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSelect = useCallback(
    (slug: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(`/tools/${slug}`);
    },
    [router, onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <Command
        className="relative z-50 w-full max-w-lg rounded-xl border bg-background shadow-2xl overflow-hidden"
        loop
        shouldFilter={true}
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="搜索工具..."
          className="flex h-12 w-full border-b border-border/40 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground/50">
            没有找到匹配的工具
          </Command.Empty>
          {(
            ["document", "image", "developer", "utility"] as ToolCategory[]
          ).map((cat) => {
            const catTools = tools.filter((t) => t.category === cat);
            if (catTools.length === 0) return null;
            return (
              <Command.Group
                key={cat}
                heading={categoryLabels[cat]}
                className="text-xs text-muted-foreground/60 mb-1"
              >
                {catTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Command.Item
                      key={tool.slug}
                      value={`${tool.name} ${tool.description} ${categoryLabels[tool.category]}`}
                      onSelect={() => handleSelect(tool.slug)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-sidebar-accent data-[selected=true]:text-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-60" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{tool.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground/60">
                          {tool.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
                        {categoryLabels[tool.category]}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            );
          })}
        </Command.List>
        <div className="border-t border-border/40 px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground/40">
          <span>↑↓ 选择</span>
          <span>↵ 打开</span>
          <span>ESC 关闭</span>
        </div>
      </Command>
    </div>
  );
}
```

- [ ] **Step 2: 在 layout.tsx 中集成 CommandMenu**

修改 `src/app/layout.tsx`，加入全局 CommandMenu 状态：

```tsx
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
```

注意：CommandMenu 是客户端组件，需要通过 AppShell 或单独的 provider 来管理状态。最简单的方式是在 AppShell 中集成。

修改 `src/components/layout/app-shell.tsx`：

```tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandMenu } from "@/components/command-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isHome && <Sidebar className="hidden lg:flex" />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isHome={isHome} onSearch={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
```

- [ ] **Step 3: 在 header 中加入搜索按钮**

修改 `src/components/layout/header.tsx`，在右侧添加搜索触发按钮：

```tsx
"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface HeaderProps {
  isHome?: boolean;
  onSearch?: () => void;
}

export function Header({ isHome, onSearch }: HeaderProps) {
  if (isHome) {
    return (
      <header className="flex items-center justify-between h-14 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex items-center justify-center size-7 rounded-md bg-foreground text-background text-[11px] font-bold font-mono">
            B
          </span>
          <span className="font-heading text-base">办到</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={onSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground/60 hover:border-foreground/20 hover:text-foreground/60 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">搜索</span>
            <kbd className="hidden sm:inline text-[10px] bg-muted/50 px-1 py-0.5 rounded">
              Ctrl+K
            </kbd>
          </button>
          <span className="hidden sm:inline text-xs text-muted-foreground/60">
            纯前端 · 完全免费
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center h-14 px-4 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0 lg:hidden">
      <Sheet>
        <SheetTrigger className="inline-flex items-center justify-center size-8 shrink-0 rounded-md hover:bg-muted transition-colors">
          <Menu className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-52">
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <Link href="/" className="ml-3 flex items-center gap-2">
        <span className="flex items-center justify-center size-5.5 rounded bg-foreground text-background text-[9px] font-bold font-mono">
          B
        </span>
        <span className="font-heading text-sm">办到</span>
      </Link>

      <button
        onClick={onSearch}
        className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground/60 hover:text-foreground/60 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
```

- [ ] **Step 4: 验证构建**

```bash
npx next build 2>&1 | cat
```

Expected: 编译成功，无类型错误

- [ ] **Step 5: 提交**

```bash
git add src/components/command-menu.tsx src/components/layout/app-shell.tsx src/components/layout/header.tsx
git commit -m "feat: Ctrl+K 全局搜索（cmdk 集成 + 搜索按钮）"
```

---

## Task 6: 二维码生成器

- [ ] **Step 1: 创建工具组件**

创建 `src/tools/qr-code/index.tsx`：

```tsx
"use client";

import { useState, useCallback } from "react";
import QRCodeLib from "qrcode";
import JSZip from "jszip";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Download, Loader2, QrCode } from "lucide-react";

export default function QrCodeTool() {
  const [input, setInput] = useState("");
  const [size, setSize] = useState(256);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!input.trim()) {
      setPreview(null);
      return;
    }
    const dataUrl = await QRCodeLib.toDataURL(input.trim(), {
      width: size,
      color: { dark: darkColor, light: lightColor },
      margin: 2,
    });
    setPreview(dataUrl);
  }, [input, size, darkColor, lightColor]);

  // 实时预览
  useState(() => {
    generatePreview();
  });

  // 当输入变化时重新生成预览
  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.trim()) {
      QRCodeLib.toDataURL(val.trim(), {
        width: size,
        color: { dark: darkColor, light: lightColor },
        margin: 2,
      }).then(setPreview);
    } else {
      setPreview(null);
    }
  };

  const handleSizeChange = (v: number[]) => {
    const newSize = v[0];
    setSize(newSize);
    if (input.trim()) {
      QRCodeLib.toDataURL(input.trim(), {
        width: newSize,
        color: { dark: darkColor, light: lightColor },
        margin: 2,
      }).then(setPreview);
    }
  };

  const handleDownload = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const lines = input.split("\n").filter((l) => l.trim());

    if (lines.length === 1) {
      const blob = await QRCodeLib.toBlob(lines[0].trim(), {
        width: size,
        color: { dark: darkColor, light: lightColor },
        margin: 2,
      });
      downloadBlob(blob, "qrcode.png");
    } else {
      const zip = new JSZip();
      for (let i = 0; i < lines.length; i++) {
        const blob = await QRCodeLib.toBlob(lines[i].trim(), {
          width: size,
          color: { dark: darkColor, light: lightColor },
          margin: 2,
        });
        zip.file(`qrcode_${i + 1}.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "qrcodes.zip");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-5">
          <h3 className="text-sm font-medium">生成设置</h3>

          <div className="space-y-2">
            <Label htmlFor="qr-input">文本或链接</Label>
            <textarea
              id="qr-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="输入文本或链接，多行可批量生成"
              className="w-full h-32 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none placeholder:text-muted-foreground/40"
            />
            <p className="text-xs text-muted-foreground/60">
              输入多行文本时，每行生成一个二维码，下载时自动打包为 ZIP
            </p>
          </div>

          <div className="space-y-2">
            <Label>尺寸 ({size}px)</Label>
            <Slider
              value={[size]}
              onValueChange={handleSizeChange}
              min={64}
              max={1024}
              step={64}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>前景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => {
                    setDarkColor(e.target.value);
                    if (input.trim()) {
                      QRCodeLib.toDataURL(input.trim(), {
                        width: size,
                        color: { dark: e.target.value, light: lightColor },
                        margin: 2,
                      }).then(setPreview);
                    }
                  }}
                  className="size-8 rounded border border-border/60 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{darkColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>背景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => {
                    setLightColor(e.target.value);
                    if (input.trim()) {
                      QRCodeLib.toDataURL(input.trim(), {
                        width: size,
                        color: { dark: darkColor, light: e.target.value },
                        margin: 2,
                      }).then(setPreview);
                    }
                  }}
                  className="size-8 rounded border border-border/60 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{lightColor}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={!input.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> 生成中...</>
            ) : input.includes("\n") && input.split("\n").filter((l) => l.trim()).length > 1 ? (
              <><Download className="mr-2 size-4" /> 批量下载 ZIP</>
            ) : (
              <><Download className="mr-2 size-4" /> 下载二维码</>
            )}
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center" style={{ minHeight: 300 }}>
          {preview ? (
            <img src={preview} alt="二维码预览" className="max-w-full max-h-[50vh] object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <QrCode className="h-10 w-10 opacity-30" />
              <p className="text-sm">输入内容后实时预览</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
npx next build 2>&1 | cat
```

- [ ] **Step 3: 提交**

```bash
git add src/tools/qr-code/
git commit -m "feat: 二维码生成器（文本/链接→二维码，批量ZIP下载）"
```

---

## Task 7: JSON 格式化

- [ ] **Step 1: 创建工具组件**

创建 `src/tools/json-formatter/index.tsx`：

```tsx
"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import {
  Copy,
  Check,
  Braces,
  Minimize2,
  Download,
} from "lucide-react";

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");

  const process = useCallback(
    (val: string, m: "format" | "minify") => {
      if (!val.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        const parsed = JSON.parse(val);
        const result =
          m === "format"
            ? JSON.stringify(parsed, null, 2)
            : JSON.stringify(parsed);
        setOutput(result);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "JSON 解析失败";
        // 尝试提取行列信息
        const match = msg.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const lines = val.substring(0, pos).split("\n");
          const line = lines.length;
          const col = lines[lines.length - 1].length + 1;
          setError(`第 ${line} 行第 ${col} 列附近语法错误`);
        } else {
          setError(msg);
        }
        setOutput("");
      }
    },
    []
  );

  const handleInput = (val: string) => {
    setInput(val);
    process(val, mode);
  };

  const handleModeChange = (m: "format" | "minify") => {
    setMode(m);
    process(input, m);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    downloadBlob(blob, "formatted.json");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "format" ? "default" : "outline"}
          onClick={() => handleModeChange("format")}
        >
          <Braces className="mr-1.5 size-3.5" /> 格式化
        </Button>
        <Button
          size="sm"
          variant={mode === "minify" ? "default" : "outline"}
          onClick={() => handleModeChange("minify")}
        >
          <Minimize2 className="mr-1.5 size-3.5" /> 压缩
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          disabled={!output}
        >
          {copied ? (
            <><Check className="mr-1.5 size-3.5" /> 已复制</>
          ) : (
            <><Copy className="mr-1.5 size-3.5" /> 复制</>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={!output}
        >
          <Download className="mr-1.5 size-3.5" /> 下载
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>输入 JSON</Label>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder='粘贴 JSON 内容，例如：\n{"name": "办到", "version": "0.1.0"}'
            className="w-full h-[50vh] rounded-lg border border-border/60 bg-background p-3 text-sm font-mono outline-none focus:border-foreground/30 resize-none placeholder:text-muted-foreground/40"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label>输出结果</Label>
          <textarea
            value=output}
            readOnly
            className="w-full h-[50vh] rounded-lg border border-border/60 bg-muted/30 p-3 text-sm font-mono resize-none"
            spellCheck={false}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
```

注意：写入文件时确保 `value={output}` 语法正确（花括号包裹）。

- [ ] **Step 2: 验证构建**

```bash
npx next build 2>&1 | cat
```

- [ ] **Step 3: 提交**

```bash
git add src/tools/json-formatter/
git commit -m "feat: JSON 格式化（格式化/压缩/错误定位/复制/下载）"
```

---

## Task 8: Markdown 预览

- [ ] **Step 1: 创建工具组件**

创建 `src/tools/markdown-preview/index.tsx`：

```tsx
"use client";

import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { Download, Eye, SplitSquareHorizontal } from "lucide-react";

const DEFAULT_MD = `# 办到 Markdown 预览

这是一个 **实时预览** 的 Markdown 编辑器。

## 支持的功能

- **加粗** 和 *斜体*
- ~~删除线~~
- [链接](https://example.com)
- 行内代码 \`code\`

## 表格

| 功能 | 状态 |
|------|------|
| PDF 拆分 | 已完成 |
| 图片压缩 | 已完成 |
| Markdown 预览 | 新增 |

## 任务列表

- [x] 分类重组
- [x] Ctrl+K 搜索
- [ ] 更多工具
`;

export default function MarkdownPreviewTool() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [viewMode, setViewMode] = useState<"split" | "preview">("split");

  const handleExportHtml = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 0.15rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0.5rem 1rem; color: #666; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <article>${document.querySelector("[data-markdown-preview]")?.innerHTML || ""}</article>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, "markdown-export.html");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === "split" ? "default" : "outline"}
          onClick={() => setViewMode("split")}
        >
          <SplitSquareHorizontal className="mr-1.5 size-3.5" /> 分栏
        </Button>
        <Button
          size="sm"
          variant={viewMode === "preview" ? "default" : "outline"}
          onClick={() => setViewMode("preview")}
        >
          <Eye className="mr-1.5 size-3.5" /> 预览
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleExportHtml}>
          <Download className="mr-1.5 size-3.5" /> 导出 HTML
        </Button>
      </div>

      <div className={`grid gap-4 ${viewMode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {viewMode === "split" && (
          <div className="space-y-2">
            <Label>编辑 Markdown</Label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[60vh] rounded-lg border border-border/60 bg-background p-3 text-sm font-mono outline-none focus:border-foreground/30 resize-none placeholder:text-muted-foreground/40"
              spellCheck={false}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>预览</Label>
          <div
            data-markdown-preview
            className="w-full h-[60vh] rounded-lg border border-border/60 bg-background p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
          >
            <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
npx next build 2>&1 | cat
```

- [ ] **Step 3: 提交**

```bash
git add src/tools/markdown-preview/
git commit -m "feat: Markdown 预览（实时预览/GFM/导出HTML）"
```

---

## Task 9: 更新文档

- [ ] **Step 1: 更新开发必看.md**

修改 `开发必看.md`，在"新增工具"部分加入新工具说明，在"工具分类"表格中更新分类映射，在"依赖清单"中加入新依赖。

具体更新点：
1. 分类表格替换为新的 4 分类
2. 依赖清单追加 `cmdk`、`qrcode`、`react-markdown`、`remark-gfm`
3. 工具列表追加二维码、JSON、Markdown

- [ ] **Step 2: 提交**

```bash
git add 开发必看.md
git commit -m "docs: 更新开发必看文档（新分类 + 新工具）"
```

---

## Task 10: 全量验证

- [ ] **Step 1: 完整构建**

```bash
npx next build 2>&1 | cat
```

Expected: 编译成功，所有页面正常生成

- [ ] **Step 2: 检查所有工具路由**

确认以下路由都能正常加载：
- `/` — 首页分组卡片
- `/tools/pdf-split` — PDF 拆分
- `/tools/image-compress` — 图片压缩
- `/tools/watermark` — 隐私水印
- `/tools/svg-convert` — SVG 转图片
- `/tools/text-cleaner` — 文本助手
- `/tools/qr-code` — 二维码生成器
- `/tools/json-formatter` — JSON 格式化
- `/tools/markdown-preview` — Markdown 预览

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: 工具站扩展完成（分类重组 + 搜索 + 3个新工具）"
```
