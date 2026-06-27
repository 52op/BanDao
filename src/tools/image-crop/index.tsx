"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import JSZip from "jszip";
import {
  BatchFileUpload,
  type BatchFileItem,
} from "@/components/tool/batch-file-upload";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Crop as CropIcon,
  Download,
  Loader2,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";

type Mode = "crop" | "resize";

const ASPECT_PRESETS = [
  { label: "自由", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "5:7", value: 5 / 7 },
];

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

const OUTPUT_EXT: Record<string, string> = {
  png: "png", jpeg: "jpg", webp: "webp",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
}

export default function ImageCropTool() {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("crop");
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [lockRatio, setLockRatio] = useState(true);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rotatedSrc, setRotatedSrc] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(90);
  const [zoomIndex, setZoomIndex] = useState(2);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rotatedUrlRef = useRef<string | null>(null);

  const activeFile = files[activeIndex];
  const displaySrc = rotatedSrc || activeFile?.previewUrl || null;
  const zoom = ZOOM_STEPS[zoomIndex];

  useEffect(() => {
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(null);
    setAspectRatio(undefined);
    setZoomIndex(2);
    if (rotatedUrlRef.current) {
      URL.revokeObjectURL(rotatedUrlRef.current);
      rotatedUrlRef.current = null;
    }
    setRotatedSrc(null);
  }, [activeIndex]);

  useEffect(() => {
    if (!activeFile?.previewUrl || rotation === 0) {
      if (rotatedUrlRef.current) {
        URL.revokeObjectURL(rotatedUrlRef.current);
        rotatedUrlRef.current = null;
      }
      setRotatedSrc(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const img = await loadImage(activeFile.previewUrl!);
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const rad = (rotation * Math.PI) / 180;
      if (rotation % 180 === 90) {
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      canvas.toBlob((b) => {
        if (cancelled || !b) return;
        const url = URL.createObjectURL(b);
        if (rotatedUrlRef.current) URL.revokeObjectURL(rotatedUrlRef.current);
        rotatedUrlRef.current = url;
        setRotatedSrc(url);
      });
    })();

    return () => { cancelled = true; };
  }, [rotation, activeFile?.previewUrl]);

  const handleFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    const items: BatchFileItem[] = imageFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setFiles((prev) => {
      const next = [...prev, ...items];
      if (prev.length === 0 && next.length > 0) setActiveIndex(0);
      return next;
    });
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      const item = files[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      setFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (activeIndex >= next.length)
          setActiveIndex(Math.max(0, next.length - 1));
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
    setActiveIndex(0);
  }, [files]);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      imgRef.current = img;
      setOriginalSize({ w: img.naturalWidth, h: img.naturalHeight });
      if (mode === "resize") {
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
      }
    },
    [mode]
  );

  const handleRotate = useCallback(async (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  }, []);

  const process = useCallback(
    async (previewUrl: string): Promise<Blob | null> => {
      const img = await loadImage(previewUrl);

      let source: HTMLImageElement | HTMLCanvasElement = img;
      if (rotation !== 0) {
        const canvas = document.createElement("canvas");
        const rad = (rotation * Math.PI) / 180;
        if (rotation % 180 === 90) {
          canvas.width = img.naturalHeight;
          canvas.height = img.naturalWidth;
        } else {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        const ctx = canvas.getContext("2d")!;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        source = canvas;
      }

      const outCanvas = document.createElement("canvas");
      const outCtx = outCanvas.getContext("2d")!;
      const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
      const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;

      if (mode === "crop" && completedCrop) {
        const dW = imgRef.current?.width || srcW;
        const dH = imgRef.current?.height || srcH;
        const scaleX = srcW / dW;
        const scaleY = srcH / dH;

        outCanvas.width = completedCrop.width * scaleX;
        outCanvas.height = completedCrop.height * scaleY;
        outCtx.drawImage(
          source,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0, 0,
          outCanvas.width, outCanvas.height
        );
      } else if (mode === "resize") {
        outCanvas.width = resizeWidth;
        outCanvas.height = resizeHeight;
        outCtx.drawImage(source, 0, 0, resizeWidth, resizeHeight);
      } else {
        outCanvas.width = srcW;
        outCanvas.height = srcH;
        outCtx.drawImage(source, 0, 0);
      }

      const mimeType = outputFormat === "jpeg" ? "image/jpeg"
        : outputFormat === "webp" ? "image/webp" : "image/png";

      return new Promise((resolve) => {
        outCanvas.toBlob((b) => resolve(b!), mimeType, quality / 100);
      });
    },
    [mode, rotation, completedCrop, resizeWidth, resizeHeight, outputFormat, quality]
  );

  const handleApply = useCallback(async () => {
    if (!activeFile?.previewUrl) return;
    setApplying(true);
    const blob = await process(activeFile.previewUrl);
    if (blob) {
      const url = URL.createObjectURL(blob);
      URL.revokeObjectURL(activeFile.previewUrl);
      setFiles((prev) => {
        const next = [...prev];
        next[activeIndex] = { ...next[activeIndex], previewUrl: url };
        return next;
      });
      setCrop(undefined);
      setCompletedCrop(null);
      setRotation(0);
      setRotatedSrc(null);
    }
    setApplying(false);
  }, [activeFile, activeIndex, process]);

  const canApply = mode === "crop" ? !!completedCrop
    : mode === "resize" ? true
    : false;

  const handleDownload = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);

    const ext = OUTPUT_EXT[outputFormat];

    if (files.length === 1) {
      const blob = await process(files[0].previewUrl!);
      if (blob) {
        const baseName = files[0].file.name.replace(/\.[^.]+$/, "");
        downloadBlob(blob, `${baseName}.${ext}`);
      }
    } else {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "processing" as const } : f
          )
        );
        try {
          const blob = await process(files[i].previewUrl!);
          if (blob) {
            const baseName = files[i].file.name.replace(/\.[^.]+$/, "");
            zip.file(`${baseName}.${ext}`, blob);
          }
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "done" as const } : f
            )
          );
        } catch {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? { ...f, status: "error" as const, error: "处理失败" }
                : f
            )
          );
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "processed_images.zip");
    }

    setLoading(false);
  }, [files, process, outputFormat]);

  return (
    <div className="space-y-6">
      <BatchFileUpload
        accept="image/*"
        files={files}
        onFiles={handleFiles}
        onRemove={handleRemove}
        onClear={handleClear}
        label="点击或拖拽上传图片"
      />

      {files.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={mode === "crop" ? "default" : "outline"}
                onClick={() => setMode("crop")}
              >
                <CropIcon className="mr-1.5 size-3.5" /> 裁剪
              </Button>
              <Button
                size="sm"
                variant={mode === "resize" ? "default" : "outline"}
                onClick={() => setMode("resize")}
              >
                <RefreshCw className="mr-1.5 size-3.5" /> 调整大小
              </Button>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRotate(-90)}
                  title="左旋 90°"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRotate(90)}
                  title="右旋 90°"
                >
                  <RotateCw className="size-3.5" />
                </Button>
              </div>
            </div>

            {mode === "crop" && (
              <div className="space-y-2">
                <Label>裁剪比例</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {ASPECT_PRESETS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => setAspectRatio(a.value)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        aspectRatio === a.value
                          ? "border-foreground bg-accent font-medium"
                          : "border-input text-muted-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "resize" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>宽度 (px)</Label>
                    <Input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => {
                        const w = parseInt(e.target.value) || 0;
                        setResizeWidth(w);
                        if (lockRatio && originalSize) {
                          setResizeHeight(
                            Math.round((w / originalSize.w) * originalSize.h)
                          );
                        }
                      }}
                      min={1}
                      max={10000}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>高度 (px)</Label>
                    <Input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => {
                        const h = parseInt(e.target.value) || 0;
                        setResizeHeight(h);
                        if (lockRatio && originalSize) {
                          setResizeWidth(
                            Math.round((h / originalSize.h) * originalSize.w)
                          );
                        }
                      }}
                      min={1}
                      max={10000}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockRatio}
                    onChange={(e) => setLockRatio(e.target.checked)}
                    className="rounded border-border"
                  />
                  锁定宽高比
                </label>
                {originalSize && (
                  <p className="text-xs text-muted-foreground">
                    原始尺寸：{originalSize.w} × {originalSize.h} px
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleApply}
              disabled={!canApply || applying}
              className="w-full"
            >
              {applying ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> 应用中...</>
              ) : (
                <><Check className="mr-2 size-4" /> 应用{ mode === "crop" ? "裁剪" : "调整大小" }</>
              )}
            </Button>

            <div className="space-y-2">
              <Label>输出格式</Label>
              <div className="flex items-center gap-3">
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as "png" | "jpeg" | "webp")}
                  className="h-8 rounded border border-input bg-transparent px-2 text-sm"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
                {outputFormat !== "png" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
                    <span className="text-xs whitespace-nowrap">质量</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="flex-1 h-1 accent-foreground"
                    />
                    <span className="text-xs w-8 text-right">{quality}%</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleDownload}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> 处理中...</>
              ) : (
                <><Download className="mr-2 size-4" /> 下载{files.length > 1 ? "全部" : ""}</>
              )}
            </Button>
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

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {originalSize && `${originalSize.w} × ${originalSize.h} px`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                  disabled={zoomIndex === 0}
                  className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"
                  title="缩小"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
                  {zoom === 1 ? "适应" : `${Math.round(zoom * 100)}%`}
                </span>
                <button
                  onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                  disabled={zoomIndex === ZOOM_STEPS.length - 1}
                  className="p-1 rounded hover:bg-muted/50 disabled:opacity-30"
                  title="放大"
                >
                  <ZoomIn className="size-4" />
                </button>
                {zoom !== 1 && (
                  <button
                    onClick={() => setZoomIndex(2)}
                    className="p-1 rounded hover:bg-muted/50"
                    title="适应窗口"
                  >
                    <Maximize className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              className="rounded-lg border bg-muted/30 p-2 flex items-center justify-center overflow-auto"
              style={{
                maxHeight: zoom === 1 ? "50vh" : `${50 * zoom}vh`,
                minHeight: 200,
              }}
            >
              {displaySrc ? (
                mode === "crop" ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                  >
                    <img
                      src={displaySrc}
                      alt="裁剪预览"
                      className="max-w-full object-contain"
                      style={{
                        maxHeight: zoom === 1 ? "50vh" : "none",
                        width: zoom === 1 ? "100%" : `${zoom * 100}%`,
                        maxWidth: zoom === 1 ? "100%" : "none",
                        height: "auto",
                      }}
                      onLoad={handleImageLoad}
                    />
                  </ReactCrop>
                ) : (
                  <img
                    src={displaySrc}
                    alt="调整预览"
                    className="max-w-full object-contain"
                    style={{
                      maxHeight: zoom === 1 ? "50vh" : "none",
                      width: zoom === 1 ? "100%" : `${zoom * 100}%`,
                      maxWidth: zoom === 1 ? "100%" : "none",
                      height: "auto",
                    }}
                    onLoad={handleImageLoad}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  请先上传图片
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <CropIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传图片开始裁剪</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持批量上传，自由裁剪、旋转、调整大小，多种输出格式
          </p>
        </div>
      )}
    </div>
  );
}
