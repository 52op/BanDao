"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Download,
  Loader2,
  Shield,
  ZoomIn,
  Archive,
} from "lucide-react";

function drawWatermark(
  img: HTMLImageElement,
  opts: {
    text: string;
    fontSize: number;
    opacity: number;
    angle: number;
    density: number;
  }
): Promise<Blob> {
  return new Promise((resolve) => {
    const maxW = 800;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = opts.opacity;
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${opts.fontSize * scale}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const spacing = opts.fontSize * scale * (9 - opts.density);
    for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
      for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((opts.angle * Math.PI) / 180);
        ctx.fillText(opts.text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    canvas.toBlob((b) => resolve(b!), "image/png", 1);
  });
}

export default function WatermarkTool() {
  const [files, setFiles] = useState<BatchFileItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [text, setText] = useState("仅供XX业务使用 他用无效");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(0.3);
  const [angle, setAngle] = useState(-30);
  const [density, setDensity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [magnify, setMagnify] = useState(false);
  const [magnifyPos, setMagnifyPos] = useState({ x: 0, y: 0 });
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);

  const handleFiles = useCallback((newFiles: File[]) => {
    const items: BatchFileItem[] = newFiles
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
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
        if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
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

  // Load active image for preview
  useEffect(() => {
    const item = files[activeIndex];
    if (!item) {
      previewImgRef.current = null;
      setPreviewCanvas(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      previewImgRef.current = img;
      // Draw preview
      const maxW = 800;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${fontSize * scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const spacing = fontSize * scale * (9 - density);
      for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
      setPreviewCanvas(canvas);
    };
    img.src = item.previewUrl!;
  }, [files, activeIndex, text, fontSize, opacity, angle, density]);

  const handlePreviewMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!previewRef.current || !previewCanvas) return;
      const rect = previewRef.current.getBoundingClientRect();
      setMagnifyPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [previewCanvas]
  );

  const handleDownloadOne = useCallback(async () => {
    const item = files[activeIndex];
    if (!item || !previewImgRef.current) return;
    setLoading(true);
    const blob = await drawWatermark(previewImgRef.current, {
      text, fontSize, opacity, angle, density,
    });
    const baseName = item.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(blob, `${baseName}_水印.png`);
    setLoading(false);
  }, [files, activeIndex, text, fontSize, opacity, angle, density]);

  const handleDownloadAll = useCallback(async () => {
    if (files.length === 0) return;
    setLoading(true);

    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "processing" as const } : f
        )
      );
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = files[i].previewUrl!;
        });
        const blob = await drawWatermark(img, { text, fontSize, opacity, angle, density });
        const baseName = files[i].file.name.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}_水印.png`, blob);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done" as const } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const, error: "处理失败" } : f
          )
        );
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, "watermarked_images.zip");
    setLoading(false);
  }, [files, text, fontSize, opacity, angle, density]);

  const magnifySize = 200;
  const magnifyZoom = 2.5;

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
      />

      {files.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-5">
            <h3 className="text-sm font-medium">水印设置</h3>
            <div className="space-y-2">
              <Label htmlFor="wm-text">水印文字</Label>
              <Input
                id="wm-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>文字大小 ({fontSize}px)</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
                min={12}
                max={64}
                step={2}
              />
            </div>
            <div className="space-y-2">
              <Label>透明度 ({Math.round(opacity * 100)}%)</Label>
              <Slider
                value={[opacity * 100]}
                onValueChange={(v) => setOpacity((Array.isArray(v) ? v[0] : v) / 100)}
                min={5}
                max={50}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>旋转角度 ({angle}°)</Label>
              <Slider
                value={[angle]}
                onValueChange={(v) => setAngle(Array.isArray(v) ? v[0] : v)}
                min={-90}
                max={90}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>水印密度</Label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">疏</span>
                <Slider
                  value={[density]}
                  onValueChange={(v) => setDensity(Array.isArray(v) ? v[0] : v)}
                  min={1}
                  max={8}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">密</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={files.length === 1 ? handleDownloadOne : handleDownloadAll}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> 处理中...</>
                ) : files.length === 1 ? (
                  <><Download className="mr-2 size-4" /> 下载加水印的图片</>
                ) : (
                  <><Archive className="mr-2 size-4" /> 批量处理并打包下载</>
                )}
              </Button>
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
              ref={previewRef}
              className="relative rounded-lg border bg-muted/30 p-2 cursor-crosshair"
              onMouseEnter={() => setMagnify(true)}
              onMouseLeave={() => setMagnify(false)}
              onMouseMove={handlePreviewMouseMove}
            >
              {previewCanvas ? (
                <img
                  src={previewCanvas.toDataURL()}
                  alt="预览"
                  className="w-full rounded object-contain"
                  style={{ maxHeight: "50vh" }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  请先上传图片
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-muted-foreground/50 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                <ZoomIn className="size-3" />
                悬停放大
              </div>

              {magnify && previewCanvas && (
                <div
                  className="pointer-events-none hidden lg:block absolute z-50 rounded-full border-2 border-foreground/20 shadow-xl overflow-hidden bg-background"
                  style={{
                    width: magnifySize,
                    height: magnifySize,
                    left: magnifyPos.x - magnifySize / 2,
                    top: magnifyPos.y - magnifySize / 2,
                  }}
                >
                  <canvas
                    width={magnifySize}
                    height={magnifySize}
                    ref={(el) => {
                      if (!el) return;
                      const ctx = el.getContext("2d");
                      if (!ctx || !previewCanvas || !previewRef.current) return;
                      const src = previewCanvas;
                      const sx = (magnifyPos.x / previewRef.current.offsetWidth) * src.width;
                      const sy = (magnifyPos.y / previewRef.current.offsetHeight) * src.height;
                      const sw = src.width / magnifyZoom;
                      const sh = src.height / magnifyZoom;
                      ctx.clearRect(0, 0, magnifySize, magnifySize);
                      ctx.drawImage(
                        src,
                        Math.max(0, sx - sw / 2),
                        Math.max(0, sy - sh / 2),
                        sw,
                        sh,
                        0,
                        0,
                        magnifySize,
                        magnifySize
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50">
            <Shield className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-base">上传图片添加水印</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            支持批量上传，自定义水印文字、大小、透明度、角度和密度
          </p>
        </div>
      )}
    </div>
  );
}
