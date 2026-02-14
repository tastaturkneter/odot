import { useState, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";

export function KeyboardShortcutHandler() {
  const [helpOpen, setHelpOpen] = useState(false);
  const showHelp = useCallback(() => setHelpOpen(true), []);
  useKeyboardShortcuts(showHelp);

  return <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />;
}
