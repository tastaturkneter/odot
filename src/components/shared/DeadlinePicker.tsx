import { cloneElement, isValidElement, useCallback, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { PickerDropdown } from "@/components/ui/picker-dropdown";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { dateToStr, strToDate } from "@/lib/dates";
import { useTranslation } from "@/hooks/useTranslation";

interface DeadlinePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  children: React.ReactNode;
  modal?: boolean;
}

/** Focus the selected day, or today, inside a calendar container. */
function focusCalendarDay(container: HTMLElement | null) {
  if (!container) return;
  requestAnimationFrame(() => {
    const target =
      container.querySelector<HTMLElement>('td[data-selected="true"] button') ??
      container.querySelector<HTMLElement>('td[data-today="true"] button');
    target?.focus();
  });
}

export function DeadlinePicker({
  value,
  onChange,
  children,
  modal,
}: DeadlinePickerProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => focusCalendarDay(calendarRef.current));
  }, []);

  function close() {
    // Focus trigger BEFORE closing — React batches the state update,
    // so focus lands on the trigger before the dropdown DOM is removed.
    triggerRef.current?.focus();
    setOpen(false);
  }

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(dateToStr(date));
      close();
    }
  }

  const trigger = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); open ? close() : handleOpen(); },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? close() : handleOpen();
          }
        },
      })
    : children;

  const dropdownContent = (
    <div ref={calendarRef}>
      <Calendar
        mode="single"
        selected={value ? strToDate(value) : undefined}
        onSelect={handleSelect}
        autoFocus
      />
      {value !== null && (
        <div className="border-t px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive"
            onClick={() => {
              onChange(null);
              close();
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            {t("picker.clearDeadline")}
          </Button>
        </div>
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
          className="w-auto p-0"
        >
          {dropdownContent}
        </PickerDropdown>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          focusCalendarDay(calendarRef.current);
        }}
      >
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}
