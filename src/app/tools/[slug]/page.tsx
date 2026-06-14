"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getToolComponent } from "@/tools/components";
import { getIcon } from "@/lib/icon-map";
import { fetchTools, type ToolItem } from "@/lib/api";
import { ToolPage } from "@/components/tool/tool-page";
import { Loader2 } from "lucide-react";

export default function ToolRoute() {
  const { slug } = useParams<{ slug: string }>();
  const [tool, setTool] = useState<ToolItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools().then((tools) => {
      const found = tools.find((t) => t.slug === slug);
      setTool(found || null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold">工具不存在</h2>
          <p className="text-muted-foreground mt-1">
            请从左侧菜单选择一个工具
          </p>
        </div>
      </div>
    );
  }

  const ToolComponent = getToolComponent(slug);
  const Icon = getIcon(tool.icon);

  if (!ToolComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold">工具组件未找到</h2>
          <p className="text-muted-foreground mt-1">
            {slug} 的前端组件尚未注册
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToolPage
      tool={{
        ...tool,
        icon: Icon,
        category: tool.category_slug as "document" | "image" | "developer" | "utility",
        component: ToolComponent,
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ToolComponent />
      </Suspense>
    </ToolPage>
  );
}
