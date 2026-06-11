"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { tools, categoryLabels, type ToolCategory } from "@/tools/registry";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  const handleSelect = useCallback(
    (slug: string) => {
      onOpenChange(false);
      router.push(`/tools/${slug}`);
    },
    [router, onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const categoryOrder: ToolCategory[] = ["document", "image", "developer", "utility"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <Command
        className="relative z-50 w-full max-w-lg rounded-xl border bg-background shadow-2xl overflow-hidden"
        loop
        shouldFilter={true}
      >
        <Command.Input
          placeholder="搜索工具..."
          className="flex h-12 w-full border-b border-border/40 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground/50">
            没有找到匹配的工具
          </Command.Empty>
          {categoryOrder.map((cat) => {
            const catTools = tools.filter((t) => t.category === cat);
            if (catTools.length === 0) return null;
            return (
              <Command.Group
                key={cat}
                heading={categoryLabels[cat]}
                className="text-xs text-muted-foreground/60 mb-1"
              >
                {catTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Command.Item
                      key={tool.slug}
                      value={`${tool.name} ${tool.description} ${categoryLabels[tool.category]}`}
                      onSelect={() => handleSelect(tool.slug)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-sidebar-accent data-[selected=true]:text-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-60" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{tool.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground/60">
                          {tool.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
                        {categoryLabels[tool.category]}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            );
          })}
        </Command.List>
        <div className="border-t border-border/40 px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground/40">
          <span>↑↓ 选择</span>
          <span>↵ 打开</span>
          <span>ESC 关闭</span>
        </div>
      </Command>
    </div>
  );
}
