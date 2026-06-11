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
    const previewEl = document.querySelector("[data-markdown-preview]");
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
    input[type="checkbox"] { margin-right: 0.5rem; }
  </style>
</head>
<body>
  <article>${previewEl?.innerHTML || ""}</article>
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
