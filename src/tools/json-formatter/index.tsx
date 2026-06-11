"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { Copy, Check, Braces, Minimize2, Download } from "lucide-react";

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"format" | "minify">("format");

  const process = useCallback((val: string, m: "format" | "minify") => {
    if (!val.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(val);
      const result =
        m === "format"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed);
      setOutput(result);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "JSON 解析失败";
      const match = msg.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const lines = val.substring(0, pos).split("\n");
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        setError(`第 ${line} 行第 ${col} 列附近语法错误`);
      } else {
        setError(msg);
      }
      setOutput("");
    }
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    process(val, mode);
  };

  const handleModeChange = (m: "format" | "minify") => {
    setMode(m);
    process(input, m);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    downloadBlob(blob, "formatted.json");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "format" ? "default" : "outline"}
          onClick={() => handleModeChange("format")}
        >
          <Braces className="mr-1.5 size-3.5" /> 格式化
        </Button>
        <Button
          size="sm"
          variant={mode === "minify" ? "default" : "outline"}
          onClick={() => handleModeChange("minify")}
        >
          <Minimize2 className="mr-1.5 size-3.5" /> 压缩
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleCopy} disabled={!output}>
          {copied ? (
            <><Check className="mr-1.5 size-3.5" /> 已复制</>
          ) : (
            <><Copy className="mr-1.5 size-3.5" /> 复制</>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload} disabled={!output}>
          <Download className="mr-1.5 size-3.5" /> 下载
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>输入 JSON</Label>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={'粘贴 JSON 内容，例如：\n{"name": "办到", "version": "0.1.0"}'}
            className="w-full h-[50vh] rounded-lg border border-border/60 bg-background p-3 text-sm font-mono outline-none focus:border-foreground/30 resize-none placeholder:text-muted-foreground/40"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label>输出结果</Label>
          <textarea
            value={output}
            readOnly
            className="w-full h-[50vh] rounded-lg border border-border/60 bg-muted/30 p-3 text-sm font-mono resize-none"
            spellCheck={false}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
