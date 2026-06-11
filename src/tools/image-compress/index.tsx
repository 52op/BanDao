"use client";

import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import {
  BatchFileUpload,
  type BatchFileItem,
} from "@/components/tool/batch-file-upload";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Download, Loader2, Archive } from "lucide-react";
import { useUnlock } from "@/components/unlock/unlock-context";
import { UnlockDialog } from "@/components/unlock/unlock-dialog";

const UNLOCK_SIZE = 5 * 1024 * 1024;

export default function ImageCompressTool() {
  const { unlocked } = useUnlock();
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<"jpeg" | "webp" | "png">("jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { name: string; blob: Blob; originalSize: number }[]
  >([]);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const needsUnlock =
    !unlocked && files.some((f) => f.file.size > UNLOCK_SIZE);

  const handleFiles = useCallback((newFiles: File[]) => {
    setError(null);
    setResults([]);
    const items: BatchFileItem[] = newFiles
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
      }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      const item = files[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      setFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [files]
  );

  const handleClear = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setResults([]);
    setError(null);
  }, [files]);

  const handleCompress = async () => {
    if (files.length === 0) return;
    if (needsUnlock) {
      setShowUnlockDialog(true);
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);

    const fileType = format === "jpeg" ? "image/jpeg" : "image/webp";
    const newResults: { name: string; blob: Blob; originalSize: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "processing" as const } : f
        )
      );
      try {
        const compressed = await imageCompression(files[i].file, {
          maxSizeMB: 100,
          maxWidthOrHeight: 4096,
          initialQuality: quality,
          useWebWorker: true,
          fileType,
        });
        newResults.push({
          name: files[i].file.name,
          blob: compressed,
          originalSize: files[i].file.size,
        });
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done" as const } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error" as const, error: "压缩失败" }
              : f
          )
        );
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  const handleDownloadOne = (item: { name: string; blob: Blob }) => {
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = item.name.replace(/\.[^.]+$/, "");
    downloadBlob(item.blob, `${baseName}_compressed.${ext}`);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadOne(results[0]);
      return;
    }
    const zip = new JSZip();
    const ext = format === "jpeg" ? "jpg" : format;
    results.forEach((r) => {
      const baseName = r.name.replace(/\.[^.]+$/, "");
      zip.file(`${baseName}_compressed.${ext}`, r.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "compressed_images.zip");
  };

  const totalOriginal = files.reduce((s, f) => s + f.file.size, 0);
  const totalCompressed = results.reduce((s, r) => s + r.blob.size, 0);

  return (
    <div className="space-y-6">
      <BatchFileUpload
        accept=".png,.jpg,.jpeg,.webp,image/*"
        files={files}
        onFiles={handleFiles}
        onRemove={handleRemove}
        onClear={handleClear}
        maxSizeMB={10}
        label="点击或拖拽上传图片"
        error={error}
      />

      {files.length > 0 && (
        <div className="space-y-5 rounded-lg border p-5">
          {format !== "png" && (
            <div className="space-y-2">
              <Label>压缩率</Label>
              <Slider
                value={[100 - quality * 100]}
                onValueChange={(v) =>
                  setQuality((100 - (Array.isArray(v) ? v[0] : v)) / 100)
                }
                min={10}
                max={90}
                step={5}
              />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(100 - quality * 100)}%
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>输出格式</Label>
            <Select
              value={format}
              onValueChange={(v) => {
                if (v) setFormat(v as "jpeg" | "webp" | "png");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="png">PNG（无损）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {format === "jpeg" && "JPEG 有损压缩，适合照片类图片"}
              {format === "webp" && "WebP 体积最小，兼容性好"}
              {format === "png" && "PNG 无损压缩，适合截图和图标，体积较大"}
            </p>
          </div>

          {results.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>
                总大小：
                <span className="font-medium">
                  {(totalOriginal / 1024 / 1024).toFixed(2)} MB
                </span>
              </span>
              <span>
                压缩后：
                <span className="font-medium text-emerald-600">
                  {(totalCompressed / 1024 / 1024).toFixed(2)} MB
                </span>
                <span className="ml-1 text-muted-foreground">
                  (节省 {Math.round((1 - totalCompressed / totalOriginal) * 100)}%)
                </span>
              </span>
            </div>
          )}

          {needsUnlock && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm">
              大文件压缩（&gt;5MB）为高级功能，点击下方按钮解锁后使用
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCompress}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> 压缩中...</>
              ) : needsUnlock ? (
                "解锁后压缩"
              ) : (
                `开始压缩 (${files.length} 个文件)`
              )}
            </Button>
            {results.length > 0 && (
              <Button variant="outline" onClick={handleDownloadAll}>
                {results.length === 1 ? (
                  <><Download className="mr-2 size-4" /> 下载</>
                ) : (
                  <><Archive className="mr-2 size-4" /> 打包下载 ZIP</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传图片开始使用</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持批量上传，PNG、JPG、WebP 格式，100% 本地处理
          </p>
        </div>
      )}

      <UnlockDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
      />
    </div>
  );
}
