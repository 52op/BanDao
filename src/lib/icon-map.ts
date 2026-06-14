import {
  FileText,
  Image,
  FileEdit,
  Shield,
  FileImage,
  QrCode,
  Code2,
  FileCode,
  Crop,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Image,
  FileEdit,
  Shield,
  FileImage,
  QrCode,
  Code2,
  FileCode,
  Crop,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || FileText;
}
