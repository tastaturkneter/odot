import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SidebarInlineInputProps {
  placeholder: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function SidebarInlineInput({
  placeholder,
  onSubmit,
  onCancel,
}: SidebarInlineInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      const trimmed = value.trim();
      if (trimmed) onSubmit(trimmed);
    } else if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="px-2 py-0.5">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        placeholder={placeholder}
        className="h-7 text-sm"
      />
    </div>
  );
}
