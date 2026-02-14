import { useEffect, useRef } from "react";

/**
 * Manages keyboard navigation inside a popover option list:
 * - Auto-focuses the first button when the popover opens
 * - Arrow Up/Down cycles through buttons
 * - Home/End jumps to first/last
 */
export function usePopoverKeyNav(open: boolean) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Wait for the popover to render in the portal
    requestAnimationFrame(() => {
      const first = listRef.current?.querySelector<HTMLElement>("button");
      first?.focus();
    });
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = listRef.current?.querySelectorAll<HTMLElement>("button");
    if (!items?.length) return;

    const focused = document.activeElement as HTMLElement;
    const index = Array.from(items).indexOf(focused);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = index < items.length - 1 ? index + 1 : 0;
        items[next].focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = index > 0 ? index - 1 : items.length - 1;
        items[prev].focus();
        break;
      }
      case "Home": {
        e.preventDefault();
        items[0].focus();
        break;
      }
      case "End": {
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      }
      case "Enter":
      case " ":
        // Don't preventDefault — let native button click fire.
        // Stop propagation to prevent global shortcut handler from intercepting.
        e.stopPropagation();
        break;
    }
  }

  return { listRef, handleKeyDown };
}
