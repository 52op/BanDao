"use client";

import { useState, useCallback } from "react";
import { FileText, ArrowRight, Download } from "lucide-react";
import { FileUpload } from "@/components/tool/file-upload";
import { LoadingButton } from "@/components/tool/loading-button";
import { downloadBlob } from "@/lib/download";

interface FormatOption {
  value: string;
  label: string;
}

interface FormatConvertConfig {
  accept: string;
  formats: FormatOption[];
  defaultFormat: string;
  hint?: string;
}

export function createFormatConvertTool(config: FormatConvertConfig) {
  return function FormatConvertTool() {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState(config.defaultFormat);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback((f: File) => {
      setFile(f);
      setError(null);
    }, []);

    const handleReset = useCallback(() => {
      setFile(null);
      setError(null);
    }, []);

    const handleConvert = useCallback(async () => {
      if (!file) return;

      setConverting(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("target_format", targetFormat);

        const res = await fetch("/api/convert/format", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          let msg = "转换失败";
          try {
            const json = JSON.parse(text);
            msg = json.message || msg;
          } catch {
            msg = text || msg;
          }
          setError(msg);
          return;
        }

        const blob = await res.blob();
        const baseName = file.name.replace(/\.[^.]+$/, "");
        downloadBlob(blob, `${baseName}.${targetFormat}`);
      } catch {
        setError("网络错误，请重试");
      } finally {
        setConverting(false);
      }
    }, [file, targetFormat]);

    return (
      <div className="space-y-6">
        <FileUpload
          accept={config.accept}
          file={file}
          error={error}
          onFile={handleFile}
          onReset={handleReset}
          hint={config.hint || `支持 ${config.accept} 格式`}
        />

        {file && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />

              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {config.formats.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>

            <LoadingButton
              onClick={handleConvert}
              loading={converting}
              disabled={!file}
            >
              <Download className="mr-2 h-4 w-4" />
              {converting ? "转换中..." : "开始转换"}
            </LoadingButton>
          </div>
        )}

        {!file && (
          <div className="text-center text-sm text-muted-foreground/50 py-8">
            上传文件后选择目标格式，点击转换即可下载
          </div>
        )}
      </div>
    );
  };
}
