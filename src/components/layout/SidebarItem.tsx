import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressCircle } from "@/components/shared/ProgressCircle";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  alert?: number;
  isActive?: boolean;
  isDragOver?: boolean;
  color?: string;
  progress?: number;
  onClick: () => void;
}

export function SidebarItem({
  icon: Icon,
  label,
  count,
  alert,
  isActive,
  isDragOver,
  color,
  progress,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        !isActive && "text-sidebar-foreground",
        isDragOver && "ring-2 ring-primary ring-inset bg-sidebar-accent",
      )}
    >
      {progress !== undefined ? (
        <ProgressCircle progress={progress} color={color} />
      ) : (
        <Icon
          className="h-4 w-4 shrink-0"
          style={color ? { color } : undefined}
        />
      )}
      <span className="truncate">{label}</span>
      {(count !== undefined && count > 0 || alert !== undefined && alert > 0) && (
        <span className="ml-auto flex items-center gap-1.5">
          {alert !== undefined && alert > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-medium leading-none text-white">
              {alert}
            </span>
          )}
          {count !== undefined && count > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
