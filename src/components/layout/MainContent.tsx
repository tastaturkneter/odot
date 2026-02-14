import { useState, type ReactNode } from "react";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <main className="relative flex-1 overflow-y-auto bg-background px-8 py-6">
      <button
        className="absolute right-4 top-4 rounded p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        onClick={() => setShortcutsOpen(true)}
        title="Keyboard shortcuts (?)"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-[11px]">?</span>
      </button>
      <div className="mx-auto max-w-2xl">{children}</div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </main>
  );
}
