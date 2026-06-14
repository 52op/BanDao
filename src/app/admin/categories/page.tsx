"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";

interface Category {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  enabled: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await adminFetch("/api/admin/categories");
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0) setCategories(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newSlug || !newName) return;
    setCreating(true);
    await adminFetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newSlug, name: newName, sort_order: categories.length }),
    });
    setNewSlug("");
    setNewName("");
    setCreating(false);
    fetchCategories();
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await adminFetch(`/api/admin/categories?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled } : c))
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此分类？")) return;
    await adminFetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
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
      <h1 className="font-heading text-2xl font-bold">分类管理</h1>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="如: document"
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">名称</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="如: 文档工具"
            className="w-40"
          />
        </div>
        <Button onClick={handleCreate} disabled={creating || !newSlug || !newName} size="sm">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          添加
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 p-3 rounded-lg border">
            <div className="flex-1">
              <span className="font-mono text-xs text-muted-foreground">{cat.slug}</span>
              <p className="font-medium">{cat.name}</p>
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={cat.enabled}
                onChange={(e) => handleToggle(cat.id, e.target.checked)}
                className="rounded"
              />
              启用
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(cat.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
