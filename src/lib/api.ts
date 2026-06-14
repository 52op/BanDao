export interface ToolItem {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category_slug: string;
  category_name: string;
  sort_order: number;
  needs_unlock: boolean;
  processor: string;
}

export interface CategoryItem {
  slug: string;
  name: string;
  sort_order: number;
}

const API_BASE = "/api";

// 带 fallback 的 fetch，API 不可用时返回默认值
async function fetchWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return fallback;
    const json = await res.json();
    if (json.code !== 0) return fallback;
    return json.data as T;
  } catch {
    return fallback;
  }
}

// 硬编码 fallback（API 不可用时使用）
const FALLBACK_CATEGORIES: CategoryItem[] = [
  { slug: "document", name: "文档工具", sort_order: 0 },
  { slug: "image", name: "图片处理", sort_order: 1 },
  { slug: "developer", name: "开发工具", sort_order: 2 },
  { slug: "utility", name: "实用工具", sort_order: 3 },
];

const FALLBACK_TOOLS: ToolItem[] = [
  { slug: "pdf-split", name: "PDF 拆分提取", description: "选择页面，秒级拆分下载新 PDF", icon: "FileText", category_slug: "document", category_name: "文档工具", sort_order: 0, needs_unlock: false, processor: "frontend" },
  { slug: "image-compress", name: "图片压缩", description: "智能压缩图片，支持格式转换", icon: "Image", category_slug: "image", category_name: "图片处理", sort_order: 1, needs_unlock: true, processor: "frontend" },
  { slug: "text-cleaner", name: "文本助手", description: "文本去重、格式化、对比", icon: "FileEdit", category_slug: "developer", category_name: "开发工具", sort_order: 2, needs_unlock: false, processor: "frontend" },
  { slug: "watermark", name: "隐私水印", description: "证件照加水印，隐私保护", icon: "Shield", category_slug: "image", category_name: "图片处理", sort_order: 3, needs_unlock: false, processor: "frontend" },
  { slug: "svg-convert", name: "SVG 转图片", description: "SVG 转 PNG / JPG / WebP，支持倍率缩放", icon: "FileImage", category_slug: "image", category_name: "图片处理", sort_order: 4, needs_unlock: false, processor: "frontend" },
  { slug: "qr-code", name: "二维码生成器", description: "文本、链接转二维码，支持批量下载", icon: "QrCode", category_slug: "utility", category_name: "实用工具", sort_order: 5, needs_unlock: false, processor: "frontend" },
  { slug: "json-formatter", name: "JSON 格式化", description: "格式化、压缩、语法检查", icon: "Code2", category_slug: "developer", category_name: "开发工具", sort_order: 6, needs_unlock: false, processor: "frontend" },
  { slug: "markdown-preview", name: "Markdown 预览", description: "实时预览 Markdown，支持导出 HTML", icon: "FileCode", category_slug: "document", category_name: "文档工具", sort_order: 7, needs_unlock: false, processor: "frontend" },
  { slug: "pdf-merge", name: "PDF 合并", description: "多个 PDF 文件合并为一个", icon: "FileText", category_slug: "document", category_name: "文档工具", sort_order: 8, needs_unlock: false, processor: "frontend" },
  { slug: "image-crop", name: "图片裁剪", description: "裁剪、调整图片尺寸，支持批量下载", icon: "Crop", category_slug: "image", category_name: "图片处理", sort_order: 9, needs_unlock: false, processor: "frontend" },
];

export async function fetchTools(): Promise<ToolItem[]> {
  return fetchWithFallback<ToolItem[]>("/tools", FALLBACK_TOOLS);
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  return fetchWithFallback<CategoryItem[]>("/categories", FALLBACK_CATEGORIES);
}
