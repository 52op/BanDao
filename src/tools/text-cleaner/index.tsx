"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

export default function TextCleanerTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function deduplicateLines(text: string): string {
    const lines = text.split("\n");
    const seen = new Set<string>();
    return lines
      .filter((line) => {
        const trimmed = line.trim();
        if (seen.has(trimmed)) return false;
        seen.add(trimmed);
        return true;
      })
      .join("\n");
  }

  function removeEmptyLines(text: string): string {
    return text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");
  }

  function trimLines(text: string): string {
    return text
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  function removeDuplicateSpaces(text: string): string {
    return text.replace(/ +/g, " ");
  }

  function fullClean(text: string): string {
    let result = text;
    result = removeDuplicateSpaces(result);
    result = trimLines(result);
    result = removeEmptyLines(result);
    result = deduplicateLines(result);
    return result;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dedup">
        <TabsList>
          <TabsTrigger value="dedup">去重</TabsTrigger>
          <TabsTrigger value="format">格式化</TabsTrigger>
          <TabsTrigger value="full">一键清洗</TabsTrigger>
        </TabsList>

        <TabsContent value="dedup" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            移除完全重复的行，保留首次出现的内容
          </p>
          <Textarea
            placeholder="粘贴需要去重的文本..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <Button onClick={() => setOutput(deduplicateLines(input))}>
            执行去重
          </Button>
        </TabsContent>

        <TabsContent value="format" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            清理多余空格、首尾空白、空行
          </p>
          <Textarea
            placeholder="粘贴需要格式化的文本..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setOutput(trimLines(input))}
            >
              去除首尾空白
            </Button>
            <Button
              variant="outline"
              onClick={() => setOutput(removeEmptyLines(input))}
            >
              去除空行
            </Button>
            <Button
              variant="outline"
              onClick={() => setOutput(removeDuplicateSpaces(input))}
            >
              合并多余空格
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="full" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            一键执行：合并空格 → 去除首尾空白 → 去除空行 → 去重
          </p>
          <Textarea
            placeholder="粘贴需要清洗的文本..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <Button onClick={() => setOutput(fullClean(input))}>
            一键清洗
          </Button>
        </TabsContent>
      </Tabs>

      {output && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">处理结果</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {input.split("\n").length} 行 → {output.split("\n").length} 行
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "已复制" : "复制"}
                </Button>
              </div>
            </div>
            <Textarea
              readOnly
              value={output}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
