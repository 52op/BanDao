import type { LazyExoticComponent, ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory = "document" | "image" | "developer" | "utility";

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  component: LazyExoticComponent<ComponentType>;
  needsUnlock?: boolean;
}
