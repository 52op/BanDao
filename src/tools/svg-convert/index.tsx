"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import {
  BatchFileUpload,
  type BatchFileItem,
} from "@/components/tool/batch-file-upload";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, FileImage, Archive, RefreshCw } from "lucide-react";

type OutputFormat = "png" | "jpeg" | "webp";

async function convertSvg(
  svgContent: string,
  opts: { format: OutputFormat; scale: number; quality: number }
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("SVG 渲染失败"));
    img.src = svgUrl;
  });

  URL.revokeObjectURL(svgUrl);

  const w = img.naturalWidth * opts.scale;
  const h = img.naturalHeight * opts.scale;
  canvas.width = w;
  canvas.height = h;

  if (opts.format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);

  const mimeType = `image/${opts.format}`;
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("转换失败"))), mimeType, opts.quality)
  );

  return blob;
}

export default function SvgConvertTool() {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [svgContents, setSvgContents] = useState<Map<string, string>>(new Map());
  const [format, setFormat] = useState<OutputFormat>("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.92);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { name: string; blob: Blob }[]
  >([]);

  const handleFiles = useCallback((newFiles: File[]) => {
    setError(null);
    setResults([]);
    const svgFiles = newFiles.filter((f) => f.name.endsWith(".svg") || f.type === "image/svg+xml");
    if (svgFiles.length === 0) {
      setError("请上传 SVG 格式文件");
      return;
    }
    const items: BatchFileItem[] = svgFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFiles((prev) => {
      const next = [...prev, ...items];
      if (prev.length === 0 && next.length > 0) setActiveIndex(0);
      return next;
    });
    // Read SVG contents
    svgFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSvgContents((prev) => {
          const next = new Map(prev);
          next.set(file.name, e.target?.result as string);
          return next;
        });
      };
      reader.readAsText(file);
    });
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      const item = files[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      setFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
        return next;
      });
      setSvgContents((prev) => {
        const next = new Map(prev);
        if (item) next.delete(item.file.name);
        return next;
      });
    },
    [files, activeIndex]
  );

  const handleClear = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setSvgContents(new Map());
    setActiveIndex(0);
    setResults([]);
    setError(null);
  }, [files]);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    setError(null);
    setLoading(true);
    setResults([]);

    const newResults: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "processing" as const } : f
        )
      );
      try {
        const content = svgContents.get(files[i].file.name);
        if (!content) throw new Error("无法读取 SVG 内容");
        const blob = await convertSvg(content, { format, scale, quality });
        newResults.push({ name: files[i].file.name, blob });
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done" as const } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const, error: "转换失败" } : f
          )
        );
      }
    }

    setResults(newResults);
    setLoading(false);
  }, [files, svgContents, format, scale, quality]);

  const handleDownloadOne = (item: { name: string; blob: Blob }) => {
    const baseName = item.name.replace(/\.svg$/i, "");
    const ext = format === "jpeg" ? "jpg" : format;
    downloadBlob(item.blob, `${baseName}.${ext}`);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadOne(results[0]);
      return;
    }
    const zip = new JSZip();
    const ext = format === "jpeg" ? "jpg" : format;
    results.forEach((r) => {
      const baseName = r.name.replace(/\.svg$/i, "");
      zip.file(`${baseName}.${ext}`, r.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "converted_images.zip");
  };

  const activePreviewUrl = files[activeIndex]?.previewUrl;

  return (
    <div className="space-y-6">
      <BatchFileUpload
        accept=".svg,image/svg+xml"
        files={files}
        onFiles={handleFiles}
        onRemove={handleRemove}
        onClear={handleClear}
        label="点击或拖拽上传 SVG 文件"
        error={error}
      />

      {files.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-5">
            <h3 className="text-sm font-medium">转换设置</h3>

            <div className="space-y-2">
              <Label>输出格式</Label>
              <Select
                value={format}
                onValueChange={(v) => { if (v) setFormat(v as OutputFormat); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG（透明背景）</SelectItem>
                  <SelectItem value="jpeg">JPG（白色背景）</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>输出倍率</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={scale}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0.1 && v <= 50) setScale(v);
                    }}
                    className="w-16 h-7 text-center text-sm"
                    min={0.1}
                    max={50}
                    step={0.5}
                  />
                  <span className="text-xs text-muted-foreground">x</span>
                </div>
              </div>
              <Slider
                value={[Math.min(scale, 10)]}
                onValueChange={(v) => setScale(Array.isArray(v) ? v[0] : v)}
                min={1}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>原始尺寸</span>
                <span>10x</span>
              </div>
            </div>

            {format !== "png" && (
              <div className="space-y-2">
                <Label>输出质量 ({Math.round(quality * 100)}%)</Label>
                <Slider
                  value={[quality * 100]}
                  onValueChange={(v) => setQuality((Array.isArray(v) ? v[0] : v) / 100)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              {format === "png" && "PNG 支持透明背景，适合图标和插画"}
              {format === "jpeg" && "JPG 不支持透明，背景填充为白色"}
              {format === "webp" && "WebP 体积更小，适合网页使用"}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConvert}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> 转换中...</>
                ) : results.length > 0 ? (
                  <><RefreshCw className="mr-2 size-4" /> 重新转换</>
                ) : files.length === 1 ? (
                  "开始转换"
                ) : (
                  `批量转换 (${files.length} 个文件)`
                )}
              </Button>
              {results.length > 0 && (
                <Button variant="outline" onClick={handleDownloadAll} disabled={loading}>
                  {results.length === 1 ? (
                    <><Download className="mr-2 size-4" /> 下载</>
                  ) : (
                    <><Archive className="mr-2 size-4" /> 打包下载 ZIP</>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {files.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {files.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 size-14 rounded-md border-2 overflow-hidden transition-colors ${
                      i === activeIndex
                        ? "border-foreground"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {item.previewUrl && (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div
              className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center"
              style={{ minHeight: 300 }}
            >
              {activePreviewUrl ? (
                <img
                  src={activePreviewUrl}
                  alt="SVG 预览"
                  className="max-w-full max-h-[50vh] object-contain"
                  style={{
                    background:
                      format === "jpeg"
                        ? "#fff"
                        : "repeating-conic-gradient(#e5e5e5 0% 25%, transparent 0% 50%) 50% / 16px 16px",
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  请先上传 SVG 文件
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <FileImage className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传 SVG 文件开始转换</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持批量上传，导出为 PNG、JPG、WebP 格式，可自定义倍率和质量
          </p>
        </div>
      )}
    </div>
  );
}
