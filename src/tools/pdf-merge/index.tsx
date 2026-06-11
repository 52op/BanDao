"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import {
  BatchFileUpload,
  type BatchFileItem,
} from "@/components/tool/batch-file-upload";
import { downloadBlob } from "@/lib/download";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, GripVertical } from "lucide-react";

export default function PdfMergeTool() {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback((newFiles: File[]) => {
    const pdfFiles = newFiles.filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (pdfFiles.length === 0) return;
    const items: BatchFileItem[] = pdfFiles.map((file) => ({
      file,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setLoading(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "processing" as const } : f
          )
        );

        const arrayBuffer = await files[i].file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done" as const } : f
          )
        );
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob(
        [mergedBytes as unknown as ArrayBuffer],
        { type: "application/pdf" }
      );
      downloadBlob(blob, "merged.pdf");
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "processing"
            ? { ...f, status: "error" as const, error: "合并失败" }
            : f
        )
      );
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <BatchFileUpload
        accept=".pdf,application/pdf"
        files={files}
        onFiles={handleFiles}
        onRemove={handleRemove}
        onClear={handleClear}
        label="点击或拖拽上传 PDF 文件"
      />

      {files.length > 0 && (
        <div className="space-y-4 rounded-lg border p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              合并顺序（{files.length} 个文件）
            </h3>
            <p className="text-xs text-muted-foreground">
              点击上下箭头调整顺序
            </p>
          </div>

          <div className="space-y-2">
            {files.map((item, i) => (
              <div
                key={`${item.file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                <span className="text-xs text-muted-foreground/60 w-6 text-center shrink-0">
                  {i + 1}
                </span>
                <FileText className="size-4 text-red-500/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {item.status === "processing" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    处理中...
                  </span>
                )}
                {item.status === "done" && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    完成
                  </span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(i)}
                    disabled={i === files.length - 1}
                    className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleMerge}
            disabled={loading || files.length < 2}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> 合并中...</>
            ) : (
              <><Download className="mr-2 size-4" /> 合并并下载</>
            )}
          </Button>
          {files.length < 2 && (
            <p className="text-xs text-muted-foreground text-center">
              至少需要 2 个 PDF 文件才能合并
            </p>
          )}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传 PDF 文件开始合并</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持多个 PDF 文件合并为一个，可调整合并顺序
          </p>
        </div>
      )}
    </div>
  );
}
