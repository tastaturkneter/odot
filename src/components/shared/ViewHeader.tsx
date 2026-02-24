import { useState, useRef, useEffect, type ReactNode } from "react";

interface ViewHeaderProps {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  onTitleChange?: (name: string) => void;
}

export function ViewHeader({ title, icon, children, onTitleChange }: ViewHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange?.(trimmed);
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 px-2 pb-4">
      <div className="flex items-center gap-2">
        {icon}
        {editing ? (
          <input
            ref={inputRef}
            className="text-xl font-semibold bg-transparent outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <h2
            className="text-xl font-semibold select-none"
            onDoubleClick={onTitleChange ? () => { setEditValue(title); setEditing(true); } : undefined}
          >
            {title}
          </h2>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
