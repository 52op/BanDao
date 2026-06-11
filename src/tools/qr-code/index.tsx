"use client";

import { useState, useCallback } from "react";
import QRCodeLib from "qrcode";
import JSZip from "jszip";
import { downloadBlob } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Download, Loader2, QrCode } from "lucide-react";

export default function QrCodeTool() {
  const [input, setInput] = useState("");
  const [size, setSize] = useState(256);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = useCallback(
    async (val: string, s: number, dark: string, light: string) => {
      if (!val.trim()) {
        setPreview(null);
        return;
      }
      const dataUrl = await QRCodeLib.toDataURL(val.trim(), {
        width: s,
        color: { dark, light },
        margin: 2,
      });
      setPreview(dataUrl);
    },
    []
  );

  const handleInputChange = (val: string) => {
    setInput(val);
    generatePreview(val, size, darkColor, lightColor);
  };

  const handleSizeChange = (v: number | readonly number[]) => {
    const newSize = Array.isArray(v) ? v[0] : v;
    setSize(newSize);
    generatePreview(input, newSize, darkColor, lightColor);
  };

  const handleDarkColorChange = (val: string) => {
    setDarkColor(val);
    generatePreview(input, size, val, lightColor);
  };

  const handleLightColorChange = (val: string) => {
    setLightColor(val);
    generatePreview(input, size, darkColor, val);
  };

  const handleDownload = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const lines = input.split("\n").filter((l) => l.trim());

    const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
      const response = await fetch(dataUrl);
      return response.blob();
    };

    if (lines.length === 1) {
      const dataUrl = await QRCodeLib.toDataURL(lines[0].trim(), {
        width: size,
        color: { dark: darkColor, light: lightColor },
        margin: 2,
      });
      const blob = await dataUrlToBlob(dataUrl);
      downloadBlob(blob, "qrcode.png");
    } else {
      const zip = new JSZip();
      for (let i = 0; i < lines.length; i++) {
        const dataUrl = await QRCodeLib.toDataURL(lines[i].trim(), {
          width: size,
          color: { dark: darkColor, light: lightColor },
          margin: 2,
        });
        const blob = await dataUrlToBlob(dataUrl);
        zip.file(`qrcode_${i + 1}.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "qrcodes.zip");
    }
    setLoading(false);
  };

  const lineCount = input.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-5">
          <h3 className="text-sm font-medium">生成设置</h3>

          <div className="space-y-2">
            <Label htmlFor="qr-input">文本或链接</Label>
            <textarea
              id="qr-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="输入文本或链接，多行可批量生成"
              className="w-full h-32 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 resize-none placeholder:text-muted-foreground/40"
            />
            <p className="text-xs text-muted-foreground/60">
              输入多行文本时，每行生成一个二维码，下载时自动打包为 ZIP
            </p>
          </div>

          <div className="space-y-2">
            <Label>尺寸 ({size}px)</Label>
            <Slider
              value={[size]}
              onValueChange={handleSizeChange}
              min={64}
              max={1024}
              step={64}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>前景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => handleDarkColorChange(e.target.value)}
                  className="size-8 rounded border border-border/60 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{darkColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>背景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => handleLightColorChange(e.target.value)}
                  className="size-8 rounded border border-border/60 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{lightColor}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={!input.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> 生成中...</>
            ) : lineCount > 1 ? (
              <><Download className="mr-2 size-4" /> 批量下载 ZIP ({lineCount} 个)</>
            ) : (
              <><Download className="mr-2 size-4" /> 下载二维码</>
            )}
          </Button>
        </div>

        <div
          className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center"
          style={{ minHeight: 300 }}
        >
          {preview ? (
            <img
              src={preview}
              alt="二维码预览"
              className="max-w-full max-h-[50vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <QrCode className="h-10 w-10 opacity-30" />
              <p className="text-sm">输入内容后实时预览</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
