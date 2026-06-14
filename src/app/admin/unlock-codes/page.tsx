"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Check, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";

interface UnlockCode {
  id: number;
  code: string;
  used: boolean;
  used_by: number | null;
  created_at: string;
  used_at: string | null;
}

export default function AdminUnlockCodesPage() {
  const [codes, setCodes] = useState<UnlockCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(1);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await adminFetch("/api/admin/unlock-codes");
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0) setCodes(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async () => {
    setCreating(true);
    const res = await adminFetch("/api/admin/unlock-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0 && json.data) {
        // 将新生成的码添加到列表前面
        const newCodes: UnlockCode[] = json.data.map((item: { code: string }, i: number) => ({
          id: Date.now() + i,
          code: item.code,
          used: false,
          used_by: null,
          created_at: new Date().toISOString(),
          used_at: null,
        }));
        setCodes((prev) => [...newCodes, ...prev]);
      }
    }
    setCreating(false);
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = async () => {
    const unused = codes.filter((c) => !c.used).map((c) => c.code).join("\n");
    await navigator.clipboard.writeText(unused);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unusedCount = codes.filter((c) => !c.used).length;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">解锁码管理</h1>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">生成数量</Label>
          <Input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            min={1}
            max={100}
            className="w-24"
          />
        </div>
        <Button onClick={handleCreate} disabled={creating} size="sm">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          生成
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll} disabled={unusedCount === 0}>
          {copied === "all" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          复制未使用 ({unusedCount})
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">解锁码</th>
              <th className="px-4 py-2 text-left font-medium">状态</th>
              <th className="px-4 py-2 text-left font-medium">创建时间</th>
              <th className="px-4 py-2 text-left font-medium">使用时间</th>
              <th className="px-4 py-2 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{item.code}</td>
                <td className="px-4 py-2">
                  {item.used ? (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">已使用</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded dark:bg-green-900/30 dark:text-green-400">
                      未使用
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{item.created_at}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{item.used_at || "-"}</td>
                <td className="px-4 py-2">
                  {!item.used && (
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === item.code ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
