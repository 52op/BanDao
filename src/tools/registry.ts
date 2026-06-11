import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import {
  FileText,
  Image,
  FileEdit,
  Shield,
  FileImage,
  QrCode,
  Code2,
  FileCode,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "document" | "image" | "developer" | "utility";

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  component: LazyExoticComponent<ComponentType>;
  needsUnlock?: boolean;
}

export const categoryLabels: Record<ToolCategory, string> = {
  document: "文档工具",
  image: "图片处理",
  developer: "开发工具",
  utility: "实用工具",
};

export const tools: ToolMeta[] = [
  {
    slug: "pdf-split",
    name: "PDF 拆分提取",
    description: "选择页面，秒级拆分下载新 PDF",
    icon: FileText,
    category: "document",
    component: lazy(() => import("./pdf-split")),
  },
  {
    slug: "image-compress",
    name: "图片压缩",
    description: "智能压缩图片，支持格式转换",
    icon: Image,
    category: "image",
    component: lazy(() => import("./image-compress")),
    needsUnlock: true,
  },
  {
    slug: "text-cleaner",
    name: "文本助手",
    description: "文本去重、格式化、对比",
    icon: FileEdit,
    category: "developer",
    component: lazy(() => import("./text-cleaner")),
  },
  {
    slug: "watermark",
    name: "隐私水印",
    description: "证件照加水印，隐私保护",
    icon: Shield,
    category: "image",
    component: lazy(() => import("./watermark")),
  },
  {
    slug: "svg-convert",
    name: "SVG 转图片",
    description: "SVG 转 PNG / JPG / WebP，支持倍率缩放",
    icon: FileImage,
    category: "image",
    component: lazy(() => import("./svg-convert")),
  },
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
  {
    slug: "pdf-merge",
    name: "PDF 合并",
    description: "多个 PDF 文件合并为一个",
    icon: FileText,
    category: "document",
    component: lazy(() => import("./pdf-merge")),
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return tools.filter((t) => t.category === category);
}
