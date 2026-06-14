import { lazy, type LazyExoticComponent, type ComponentType } from "react";

const toolComponents: Record<string, LazyExoticComponent<ComponentType>> = {
  "pdf-split": lazy(() => import("./pdf-split")),
  "image-compress": lazy(() => import("./image-compress")),
  "text-cleaner": lazy(() => import("./text-cleaner")),
  "watermark": lazy(() => import("./watermark")),
  "svg-convert": lazy(() => import("./svg-convert")),
  "qr-code": lazy(() => import("./qr-code")),
  "json-formatter": lazy(() => import("./json-formatter")),
  "markdown-preview": lazy(() => import("./markdown-preview")),
  "pdf-merge": lazy(() => import("./pdf-merge")),
  "image-crop": lazy(() => import("./image-crop")),
};

export function getToolComponent(slug: string): LazyExoticComponent<ComponentType> | undefined {
  return toolComponents[slug];
}
