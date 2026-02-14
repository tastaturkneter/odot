import { useEffect } from "react";
import { useActiveView } from "./useActiveView";
import { useTodoListContext } from "./useTodoListContext";

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

function shouldSuppressShortcuts(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;

  if (isInputFocused()) return true;

  // Inside a dialog (modal) — let Radix handle events
  if (el.closest('[data-slot="dialog-content"]')) return true;

  // Inside a popover content
  if (el.closest('[data-slot="popover-content"]')) return true;

  // Inside an inline picker dropdown
  if (el.closest('[data-picker-dropdown]')) return true;

  return false;
}

export function useKeyboardShortcuts(onShowHelp?: () => void) {
  const { setActiveView, setNewModalOpen, setSearchOpen } = useActiveView();
  const listActions = useTodoListContext();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K: open search (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Never intercept other combos with modifier keys (except Escape)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Allow Escape to work even in inputs (to blur them)
      if (e.key === "Escape") {
        if (isInputFocused()) {
          (document.activeElement as HTMLElement)?.blur();
          return;
        }
        // If in a dialog/popover/picker, let the overlay handle Escape
        if (shouldSuppressShortcuts()) return;

        listActions?.collapseSelected();
        return;
      }

      // Don't intercept when in overlays (dialogs, popovers, pickers) or inputs
      if (shouldSuppressShortcuts()) return;

      if (e.key === "?" && onShowHelp) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      switch (e.key) {
        // Navigation
        case "j":
        case "ArrowDown":
          e.preventDefault();
          listActions?.moveDown();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          listActions?.moveUp();
          break;

        // Expand / collapse
        case "Enter":
          e.preventDefault();
          listActions?.expandSelected();
          break;

        // Toggle completion
        case " ":
          e.preventDefault();
          listActions?.toggleCompleteSelected();
          break;

        // New todo
        case "n":
          e.preventDefault();
          setNewModalOpen(true);
          break;

        // Pickers
        case "d":
          e.preventDefault();
          listActions?.openPickerOnSelected("when");
          break;
        case "l":
          e.preventDefault();
          listActions?.openPickerOnSelected("deadline");
          break;
        case "p":
          e.preventDefault();
          listActions?.openPickerOnSelected("project");
          break;
        case "t":
          e.preventDefault();
          listActions?.openPickerOnSelected("tag");
          break;

        // Someday
        case "s":
          e.preventDefault();
          listActions?.setSomeday();
          break;

        // Delete
        case "Backspace":
        case "Delete":
          e.preventDefault();
          listActions?.deleteSelected();
          break;

        // View switching (1-5)
        case "1":
          e.preventDefault();
          setActiveView({ kind: "inbox" });
          break;
        case "2":
          e.preventDefault();
          setActiveView({ kind: "today" });
          break;
        case "3":
          e.preventDefault();
          setActiveView({ kind: "upcoming" });
          break;
        case "4":
          e.preventDefault();
          setActiveView({ kind: "someday" });
          break;
        case "5":
          e.preventDefault();
          setActiveView({ kind: "logbook" });
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setActiveView, setNewModalOpen, setSearchOpen, listActions, onShowHelp]);
}
