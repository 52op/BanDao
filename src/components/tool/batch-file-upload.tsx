"use client";

import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchFileItem {
  file: File;
  previewUrl?: string;
  status: "pending" | "processing" | "done" | "error";
  progress?: number;
  error?: string;
}

interface BatchFileUploadProps {
  accept?: string;
  files: BatchFileItem[];
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  maxSizeMB?: number;
  label?: string;
  error?: string | null;
}

export function BatchFileUpload({
  accept,
  files,
  onFiles,
  onRemove,
  onClear,
  maxSizeMB,
  label = "点击或拖拽上传文件",
  error,
}: BatchFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length) onFiles(dropped);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length) onFiles(selected);
      e.target.value = "";
    },
    [onFiles]
  );

  const isImage = (f: File) => f.type.startsWith("image/");

  if (files.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            已选择 {files.length} 个文件
          </span>
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清空全部
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {files.map((item, i) => (
            <div
              key={`${item.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              {isImage(item.file) && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  className="size-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="size-10 shrink-0 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                  {item.file.name.split(".").pop()?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.status === "processing" && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">处理中...</span>
                  )}
                  {item.status === "done" && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">完成</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-xs text-destructive">{item.error || "失败"}</span>
                  )}
                </div>
              </div>
              {item.status === "pending" && (
                <button
                  onClick={() => onRemove(i)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground hover:border-foreground/20 hover:bg-muted/30 transition-colors"
        >
          <Upload className="size-3.5" />
          继续添加文件
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
          error
            ? "border-destructive/50 bg-destructive/5"
            : "border-border/60 hover:border-foreground/20 hover:bg-muted/30"
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground/70">{label}</p>
        <p className="text-xs text-muted-foreground/40">
          支持多选或拖拽多个文件
          {maxSizeMB ? ` · 单文件最大 ${maxSizeMB}MB` : ""}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
