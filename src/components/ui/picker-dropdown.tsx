import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PickerDropdownProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * A simple absolutely-positioned dropdown for use inside Dialogs.
 * Unlike Popover, this renders inline (no portal), so it works
 * correctly with the Dialog's focus trap.
 */
export function PickerDropdown({
  open,
  onClose,
  children,
  className,
}: PickerDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    // Remember what was focused before opening
    previousFocusRef.current = document.activeElement as HTMLElement;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        // stopImmediatePropagation prevents other document-level listeners
        // (like Radix Dialog's Escape handler) from also firing
        e.stopImmediatePropagation();
        onCloseRef.current();
        previousFocusRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
        previousFocusRef.current?.focus();
      }
    }

    // Capture phase on window to intercept before Radix Dialog's
    // document-level Escape handler (capture: window → document → ...)
    window.addEventListener("keydown", handleEsc, true);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleEsc, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Restore focus to trigger when the dropdown closes.
  // Use rAF to run after Dialog's focus trap has settled.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const el = previousFocusRef.current;
      requestAnimationFrame(() => el?.focus());
    }
    wasOpen.current = open;
  }, [open]);

  // Reposition if dropdown would overflow the viewport
  const [flipUp, setFlipUp] = useState(false);
  const [shiftX, setShiftX] = useState(0);
  const [maxH, setMaxH] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    if (!open) {
      setFlipUp(false);
      setShiftX(0);
      setMaxH(undefined);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const pad = 8;

    // Measure available space from the parent trigger wrapper
    const anchor = el.parentElement?.getBoundingClientRect();
    if (anchor) {
      const spaceBelow = window.innerHeight - anchor.bottom - pad;
      const spaceAbove = anchor.top - pad;
      if (spaceAbove > spaceBelow) {
        setFlipUp(true);
        setMaxH(spaceAbove);
      } else {
        setMaxH(spaceBelow);
      }
    }

    // Horizontal: recalculate whenever the dropdown resizes
    // (e.g. RecurrencePicker switching from preset list to wider custom form)
    function updateShiftX() {
      const dropdown = ref.current;
      if (!dropdown?.parentElement) return;
      const parentLeft = dropdown.parentElement.getBoundingClientRect().left;
      const right = parentLeft + dropdown.offsetWidth;
      if (right > window.innerWidth - pad) {
        setShiftX(-(right - window.innerWidth + pad));
      } else if (parentLeft < pad) {
        setShiftX(pad - parentLeft);
      } else {
        setShiftX(0);
      }
    }

    updateShiftX();
    const observer = new ResizeObserver(updateShiftX);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      data-picker-dropdown=""
      onKeyDown={(e) => {
        // Stop Enter/Space from reaching the global keyboard shortcut handler
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
        }
      }}
      style={{
        ...(shiftX ? { left: shiftX } : {}),
        ...(maxH != null ? { maxHeight: maxH } : {}),
      }}
      className={cn(
        "absolute left-0 z-50 max-h-[min(20rem,60vh)] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        flipUp
          ? "bottom-full mb-1 slide-in-from-bottom-2"
          : "top-full mt-1 slide-in-from-top-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
