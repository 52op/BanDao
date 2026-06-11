"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { getToolBySlug } from "@/tools/registry";
import { ToolPage } from "@/components/tool/tool-page";
import { Loader2 } from "lucide-react";

export default function ToolRoute() {
  const { slug } = useParams<{ slug: string }>();
  const tool = getToolBySlug(slug);

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

  const ToolComponent = tool.component;

  return (
    <ToolPage tool={tool}>
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
