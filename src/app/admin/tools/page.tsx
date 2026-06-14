"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface Tool {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category_slug: string;
  sort_order: number;
  enabled: boolean;
  needs_unlock: boolean;
  processor: string;
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    const res = await fetch("/api/admin/tools");
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0) setTools(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleToggle = async (slug: string, field: "enabled" | "needs_unlock", value: boolean) => {
    setSaving(slug);
    await fetch(`/api/admin/tools?slug=${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setTools((prev) =>
      prev.map((t) => (t.slug === slug ? { ...t, [field]: value } : t))
    );
    setSaving(null);
  };

  const handleUpdate = async (slug: string, data: Partial<Tool>) => {
    setSaving(slug);
    await fetch(`/api/admin/tools?slug=${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setTools((prev) =>
      prev.map((t) => (t.slug === slug ? { ...t, ...data } : t))
    );
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">工具管理</h1>

      <div className="space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.slug}
            className="flex items-center gap-4 p-4 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {tool.slug}
                </span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {tool.processor}
                </span>
              </div>
              <p className="font-medium mt-1">{tool.name}</p>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={tool.enabled}
                  onChange={(e) => handleToggle(tool.slug, "enabled", e.target.checked)}
                  disabled={saving === tool.slug}
                  className="rounded"
                />
                启用
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={tool.needs_unlock}
                  onChange={(e) => handleToggle(tool.slug, "needs_unlock", e.target.checked)}
                  disabled={saving === tool.slug}
                  className="rounded"
                />
                需解锁
              </label>
              {saving === tool.slug && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
