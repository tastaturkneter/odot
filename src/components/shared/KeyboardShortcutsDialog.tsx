import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const t = useTranslation();

  const sections = [
    {
      title: t("shortcuts.navigation"),
      shortcuts: [
        { keys: ["j", "\u2193"], description: t("shortcuts.moveDown") },
        { keys: ["k", "\u2191"], description: t("shortcuts.moveUp") },
        { keys: ["Enter"], description: t("shortcuts.expandCollapse") },
        { keys: ["Esc"], description: t("shortcuts.collapseBlur") },
        { keys: ["1\u20135"], description: t("shortcuts.switchView") },
      ],
    },
    {
      title: t("shortcuts.actions"),
      shortcuts: [
        { keys: ["Space"], description: t("shortcuts.toggleComplete") },
        { keys: ["n"], description: t("shortcuts.newTodo") },
        { keys: ["\u232B"], description: t("shortcuts.delete") },
        { keys: ["s"], description: t("shortcuts.markSomeday") },
      ],
    },
    {
      title: t("shortcuts.pickers"),
      shortcuts: [
        { keys: ["d"], description: t("shortcuts.scheduleDate") },
        { keys: ["l"], description: t("shortcuts.deadlineShortcut") },
        { keys: ["p"], description: t("shortcuts.projectShortcut") },
        { keys: ["t"], description: t("shortcuts.tagShortcut") },
      ],
    },
    {
      title: t("shortcuts.global"),
      shortcuts: [
        { keys: ["\u2318K"], description: t("shortcuts.commandPalette") },
        { keys: ["?"], description: t("shortcuts.thisHelp") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>
            {t("shortcuts.description")}
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
