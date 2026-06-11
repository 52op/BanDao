import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import {
  FileText,
  Image,
  FileEdit,
  Shield,
  FileImage,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "pdf" | "image" | "text" | "privacy";

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
  pdf: "PDF 工具",
  image: "图片处理",
  text: "文本助手",
  privacy: "隐私安全",
};

export const tools: ToolMeta[] = [
  {
    slug: "pdf-split",
    name: "PDF 拆分提取",
    description: "选择页面，秒级拆分下载新 PDF",
    icon: FileText,
    category: "pdf",
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
    category: "text",
    component: lazy(() => import("./text-cleaner")),
  },
  {
    slug: "watermark",
    name: "隐私水印",
    description: "证件照加水印，隐私保护",
    icon: Shield,
    category: "privacy",
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
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return tools.filter((t) => t.category === category);
}
