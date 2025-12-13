import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ConfluenceTagProps {
  label: string;
  type: "pro" | "contro";
  onRemove?: () => void;
  removable?: boolean;
}

export default function ConfluenceTag({ label, type, onRemove, removable = true }: ConfluenceTagProps) {
  return (
    <Badge
      variant="secondary"
      className={`gap-1 ${
        type === "pro"
          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30"
      }`}
      data-testid={`tag-${type}-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {label}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-70"
          data-testid={`button-remove-tag-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
}
