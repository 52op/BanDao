"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import {
  BatchFileUpload,
  type BatchFileItem,
} from "@/components/tool/batch-file-upload";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  Shield,
  ZoomIn,
  Archive,
  Palette,
  Type,
} from "lucide-react";

const FONT_FAMILIES = [
  { label: "无衬线", value: "Arial, Helvetica, sans-serif" },
  { label: "衬线", value: '"Times New Roman", Georgia, serif' },
  { label: "等宽", value: '"Courier New", "Consolas", monospace' },
  { label: "微软雅黑", value: '"Microsoft YaHei", "微软雅黑", sans-serif' },
  { label: "黑体", value: '"SimHei", "黑体", sans-serif' },
  { label: "宋体", value: '"SimSun", "宋体", serif' },
  { label: "楷体", value: '"KaiTi", "楷体", serif' },
  { label: "仿宋", value: '"FangSong", "仿宋", serif' },
];

const DATE_FORMATS = [
  { label: "2026-06-27", value: "YYYY-MM-DD" },
  { label: "2026年6月27日", value: "YYYY年M月D日" },
];

function formatDate(fmt: string): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return fmt
    .replace("YYYY", String(year))
    .replace("MM", String(month).padStart(2, "0"))
    .replace("DD", String(day).padStart(2, "0"))
    .replace("M", String(month))
    .replace("D", String(day));
}

function buildText(base: string, dateEnabled: boolean, dateFormat: string): string {
  let t = base.trim() || "水印";
  if (dateEnabled) t += " " + formatDate(dateFormat);
  return t;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  lineHeight: number
) {
  const lines = text.split("\n");
  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

function drawWatermark(
  img: HTMLImageElement,
  opts: {
    text: string;
    fontSize: number;
    opacity: number;
    angle: number;
    density: number;
    color: string;
    fontFamily: string;
    mode: "tile" | "single";
    dateEnabled: boolean;
    dateFormat: string;
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
    ctx.fillStyle = opts.color;
    ctx.font = `bold ${opts.fontSize * scale}px ${opts.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const finalText = buildText(opts.text, opts.dateEnabled, opts.dateFormat);
    const fs = opts.fontSize * scale;
    const lineHeight = fs * 1.4;

    if (opts.mode === "single") {
      const padding = 40 * scale;
      const cx = canvas.width - padding;
      const cy = canvas.height - padding;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((opts.angle * Math.PI) / 180);
      drawLines(ctx, finalText, 0, 0, lineHeight);
      ctx.restore();
    } else {
      const spacing = fs * (13 - opts.density * 1.5);
      for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((opts.angle * Math.PI) / 180);
          drawLines(ctx, finalText, 0, 0, lineHeight);
          ctx.restore();
        }
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
  const [color, setColor] = useState("#000000");
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [mode, setMode] = useState<"tile" | "single">("tile");
  const [dateEnabled, setDateEnabled] = useState(false);
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
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
      const maxW = 800;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize * scale}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const finalText = buildText(text, dateEnabled, dateFormat);
      const fs = fontSize * scale;
      const lineHeight = fs * 1.4;

      if (mode === "single") {
        const padding = 40 * scale;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.save();
        ctx.translate(canvas.width - padding, canvas.height - padding);
        ctx.rotate((angle * Math.PI) / 180);
        drawLines(ctx, finalText, 0, 0, lineHeight);
        ctx.restore();
      } else {
        const spacing = fs * (13 - density * 1.5);
        for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
          for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((angle * Math.PI) / 180);
            drawLines(ctx, finalText, 0, 0, lineHeight);
            ctx.restore();
          }
        }
      }

      ctx.restore();
      setPreviewCanvas(canvas);
    };
    img.src = item.previewUrl!;
  }, [files, activeIndex, text, fontSize, opacity, angle, density, color, fontFamily, mode, dateEnabled, dateFormat]);

  const handlePreviewMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!previewRef.current || !previewCanvas) return;
      const rect = previewRef.current.getBoundingClientRect();
      setMagnifyPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [previewCanvas]
  );

  const getOpts = useCallback(() => ({
    text, fontSize, opacity, angle, density, color, fontFamily, mode, dateEnabled, dateFormat,
  }), [text, fontSize, opacity, angle, density, color, fontFamily, mode, dateEnabled, dateFormat]);

  const handleDownloadOne = useCallback(async () => {
    const item = files[activeIndex];
    if (!item || !previewImgRef.current) return;
    setLoading(true);
    const blob = await drawWatermark(previewImgRef.current, getOpts());
    const baseName = item.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(blob, `${baseName}_水印.png`);
    setLoading(false);
  }, [files, activeIndex, getOpts]);

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
        const blob = await drawWatermark(img, getOpts());
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
  }, [files, getOpts]);

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
              <Textarea
                id="wm-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={dateEnabled}
                  onChange={(e) => setDateEnabled(e.target.checked)}
                  className="size-4"
                />
                自动添加日期
              </label>
              {dateEnabled && (
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="h-7 rounded border border-input bg-transparent px-2 text-xs"
                >
                  {DATE_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-7 cursor-pointer rounded border p-0.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <Type className="size-4 text-muted-foreground" />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="h-7 rounded border border-input bg-transparent px-2 text-xs"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
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
              <Label>水印位置</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("tile")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    mode === "tile"
                      ? "border-foreground bg-accent font-medium"
                      : "border-input text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  平铺
                </button>
                <button
                  onClick={() => setMode("single")}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    mode === "single"
                      ? "border-foreground bg-accent font-medium"
                      : "border-input text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                >
                  右下角单条
                </button>
              </div>
            </div>

            {mode === "tile" && (
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
            )}

            <div className="flex gap-3 pt-2">
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
            支持批量上传，自定义文字、颜色、字体、位置和密度
          </p>
        </div>
      )}
    </div>
  );
}
