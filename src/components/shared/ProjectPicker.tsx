import { cloneElement, isValidElement, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { PickerDropdown } from "@/components/ui/picker-dropdown";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@evolu/react";
import { allProjects } from "@/db/queries";
import { FolderOpen, X, Check } from "lucide-react";
import { usePopoverKeyNav } from "@/hooks/usePopoverKeyNav";

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  children: React.ReactNode;
  modal?: boolean;
}

export function ProjectPicker({
  value,
  onChange,
  children,
  modal,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const projects = useQuery(allProjects);
  const { listRef, handleKeyDown: handleListKeyDown } = usePopoverKeyNav(open);
  const triggerRef = useRef<HTMLElement>(null);

  function close() {
    triggerRef.current?.focus();
    setOpen(false);
  }

  function pick(projectId: string | null) {
    onChange(projectId);
    close();
  }

  const trigger = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); open ? close() : setOpen(true); },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? close() : setOpen(true);
          }
        },
      })
    : children;

  const dropdownContent = (
    <div ref={listRef} onKeyDown={handleListKeyDown} className="flex flex-col py-1">
      {projects.map((project) => (
        <button
          key={project.id}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          onClick={() => pick(project.id)}
        >
          <FolderOpen
            className="h-4 w-4 shrink-0"
            style={
              project.color ? { color: project.color } : undefined
            }
          />
          <span className="flex-1 truncate text-left">
            {project.name}
          </span>
          {value === project.id && (
            <Check className="h-3.5 w-3.5 text-primary" />
          )}
        </button>
      ))}
      {projects.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No projects yet
        </p>
      )}
      {value !== null && (
        <>
          <Separator className="my-1" />
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => pick(null)}
          >
            <X className="h-4 w-4" />
            Remove from project
          </button>
        </>
      )}
    </div>
  );

  if (modal) {
    return (
      <div className="relative inline-flex">
        {trigger}
        <PickerDropdown
          open={open}
          onClose={close}
          className="w-48 p-0"
        >
          {dropdownContent}
        </PickerDropdown>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent className="w-48 p-0" align="start">
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}
