import { cn } from "@/lib/utils";

type AdVariant = "top" | "sidebar" | "inline";

export function AdBanner({
  variant = "inline",
  className,
}: {
  variant?: AdVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 text-muted-foreground/30 text-[11px] font-mono tracking-wider uppercase",
        variant === "top" && "h-14 w-full",
        variant === "sidebar" && "h-64 w-full",
        variant === "inline" && "h-16 w-full",
        className
      )}
    >
      广告位
    </div>
  );
}
