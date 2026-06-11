"use client";

import { useState, useCallback, useRef } from "react";
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
import { Crop as CropIcon, Download, Loader2, RefreshCw } from "lucide-react";

type Mode = "crop" | "resize";

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
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);

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
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
    },
    []
  );

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1);
      });
    },
    []
  );

  const getResizedImg = useCallback(
    async (image: HTMLImageElement, w: number, h: number): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0, w, h);
      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1);
      });
    },
    []
  );

  const processOne = useCallback(
    async (file: BatchFileItem): Promise<Blob | null> => {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = file.previewUrl!;
      });

      if (mode === "crop" && completedCrop) {
        return getCroppedImg(img, completedCrop);
      } else if (mode === "resize") {
        return getResizedImg(img, resizeWidth, resizeHeight);
      }
      return null;
    },
    [mode, completedCrop, resizeWidth, resizeHeight, getCroppedImg, getResizedImg]
  );

  const handleDownload = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);

    if (files.length === 1) {
      const blob = await processOne(files[0]);
      if (blob) {
        const baseName = files[0].file.name.replace(/\.[^.]+$/, "");
        downloadBlob(blob, `${baseName}_processed.png`);
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
          const blob = await processOne(files[i]);
          if (blob) {
            const baseName = files[i].file.name.replace(/\.[^.]+$/, "");
            zip.file(`${baseName}_processed.png`, blob);
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
  }, [files, processOne]);

  const activePreviewUrl = files[activeIndex]?.previewUrl;

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
            <div className="flex items-center gap-2">
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
            </div>

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

            {mode === "crop" && (
              <p className="text-xs text-muted-foreground">
                在图片上拖拽选择裁剪区域
              </p>
            )}

            <Button
              onClick={handleDownload}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> 处理中...</>
              ) : files.length === 1 ? (
                <><Download className="mr-2 size-4" /> 下载处理后的图片</>
              ) : (
                <><Download className="mr-2 size-4" /> 批量处理并打包下载</>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {files.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {files.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveIndex(i);
                      setCrop(undefined);
                      setCompletedCrop(null);
                    }}
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

            <div className="rounded-lg border bg-muted/30 p-2 flex items-center justify-center overflow-auto">
              {activePreviewUrl ? (
                mode === "crop" ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                  >
                    <img
                      src={activePreviewUrl}
                      alt="裁剪预览"
                      className="max-w-full max-h-[50vh] object-contain"
                      onLoad={handleImageLoad}
                      ref={imgRef}
                    />
                  </ReactCrop>
                ) : (
                  <img
                    src={activePreviewUrl}
                    alt="调整预览"
                    className="max-w-full max-h-[50vh] object-contain"
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
            支持批量上传，自由裁剪或按尺寸调整大小
          </p>
        </div>
      )}
    </div>
  );
}
