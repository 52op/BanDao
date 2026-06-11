"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { FileUpload } from "@/components/tool/file-upload";
import { downloadBlob } from "@/lib/download";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

export default function PdfSplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    if (f.type !== "application/pdf") {
      setError("请上传 PDF 文件");
      return;
    }
    setFile(f);
    try {
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      setTotalPages(doc.getPageCount());
    } catch {
      setError("PDF 解析失败，文件可能已损坏");
      setFile(null);
      setTotalPages(0);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setPageInput("");
    setError(null);
  }, []);

  function parsePageRanges(input: string, max: number): number[] {
    const pages: number[] = [];
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        const num = parseInt(part, 10);
        if (num >= 1 && num <= max) pages.push(num);
      } else if (/^\d+-\d+$/.test(part)) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        for (let i = Math.max(1, start); i <= Math.min(max, end); i++) pages.push(i);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  const handleExtract = async () => {
    if (!file || !pageInput.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const pages = parsePageRanges(pageInput, totalPages);
      if (pages.length === 0) throw new Error("请输入有效的页码范围");

      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, pages.map((p) => p - 1));
      copied.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(
        new Blob([pdfBytes as BlobPart], { type: "application/pdf" }),
        `${baseName}_提取${pages.length}页.pdf`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "提取失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload
        accept=".pdf,application/pdf"
        file={file}
        error={error}
        onFile={handleFile}
        onReset={handleReset}
        label="点击或拖拽上传 PDF"
      />

      {totalPages > 0 && (
        <div className="space-y-4 rounded-lg border p-5">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span>
              文件 <span className="font-medium">{file?.name}</span>
              ，共 <span className="font-medium">{totalPages}</span> 页
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pageRange">提取页码</Label>
            <Input
              id="pageRange"
              placeholder="示例：1, 3-5, 8"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              支持单个页码和范围，用逗号分隔
            </p>
          </div>
          <Button
            onClick={handleExtract}
            disabled={loading || !pageInput.trim()}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> 处理中...</>
            ) : (
              <><Download className="mr-2 size-4" /> 开始提取并下载</>
            )}
          </Button>
        </div>
      )}

      {!file && totalPages === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传 PDF 开始使用</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持拆分、提取指定页面，全部在浏览器本地完成
          </p>
        </div>
      )}
    </div>
  );
}
