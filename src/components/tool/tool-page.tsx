import type { ToolMeta } from "@/tools/registry";

export function ToolPage({
  tool,
  children,
}: {
  tool: ToolMeta;
  children: React.ReactNode;
}) {
  const Icon = tool.icon;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="h-6 w-6 text-muted-foreground/60" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{tool.name}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">{tool.description}</p>
      </div>

      {children}
    </div>
  );
}
