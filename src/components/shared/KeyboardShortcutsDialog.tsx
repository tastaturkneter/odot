import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["j", "\u2193"], description: "Move down" },
      { keys: ["k", "\u2191"], description: "Move up" },
      { keys: ["Enter"], description: "Expand / collapse" },
      { keys: ["Esc"], description: "Collapse / blur" },
      { keys: ["1\u20135"], description: "Switch view" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["Space"], description: "Toggle complete" },
      { keys: ["n"], description: "New todo" },
      { keys: ["\u232b"], description: "Delete" },
      { keys: ["s"], description: "Mark as Someday" },
    ],
  },
  {
    title: "Pickers",
    shortcuts: [
      { keys: ["d"], description: "Schedule date" },
      { keys: ["l"], description: "Deadline" },
      { keys: ["p"], description: "Project" },
      { keys: ["t"], description: "Tag" },
    ],
  },
  {
    title: "Global",
    shortcuts: [
      { keys: ["\u2318K"], description: "Command palette" },
      { keys: ["?"], description: "This help" },
    ],
  },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick keys to navigate and manage your tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          {i > 0 && (
                            <span className="mx-0.5 text-xs text-muted-foreground">
                              /
                            </span>
                          )}
                          <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
