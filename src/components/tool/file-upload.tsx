"use client";

import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  file: File | null;
  previewUrl?: string | null;
  error?: string | null;
  onFile: (file: File) => void;
  onReset: () => void;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileUpload({
  accept,
  file,
  previewUrl,
  error,
  onFile,
  onReset,
  maxSizeMB,
  label = "点击或拖拽上传文件",
  hint,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const isImage = file?.type.startsWith("image/");

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        {isImage && previewUrl && (
          <img
            src={previewUrl}
            alt="预览"
            className="size-12 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
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
        {(hint || maxSizeMB) && (
          <p className="text-xs text-muted-foreground/40">
            {hint || ""}
            {hint && maxSizeMB ? " · " : ""}
            {maxSizeMB ? `最大 ${maxSizeMB}MB` : ""}
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
