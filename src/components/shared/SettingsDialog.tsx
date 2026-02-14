import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { SYNC_URL_KEY, DEFAULT_SYNC_URL } from "@/db/evolu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

const upcomingOptions = [7, 14, 30] as const;

function getStoredSyncUrl(): string {
  try {
    return localStorage.getItem(SYNC_URL_KEY) || "";
  } catch {
    return "";
  }
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { get, set } = useSettings();

  const savedRange = get("upcomingRange");
  const daysAhead = savedRange ? parseInt(savedRange, 10) : 7;

  const [syncUrl, setSyncUrl] = useState(getStoredSyncUrl);
  const [syncDirty, setSyncDirty] = useState(false);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      const stored = getStoredSyncUrl();
      setSyncUrl(stored);
      setSyncDirty(false);
    }
  }, [open]);

  function handleSyncUrlChange(value: string) {
    setSyncUrl(value);
    const stored = getStoredSyncUrl();
    setSyncDirty(value !== stored);
  }

  function handleSyncSave() {
    const trimmed = syncUrl.trim();
    if (trimmed) {
      localStorage.setItem(SYNC_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(SYNC_URL_KEY);
    }
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appearance */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Appearance</h3>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {themes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                      theme === t.value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTheme(t.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Upcoming range */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Upcoming</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Number of days shown in the Upcoming view.
            </p>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {upcomingOptions.map((days) => (
                <button
                  key={days}
                  className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                    daysAhead === days
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => set("upcomingRange", String(days))}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date format */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Date format</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Order for short date input in quick add (e.g. !15.3 or !3.15).
            </p>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {([
                { value: "day-first", label: "Day first (EU)" },
                { value: "month-first", label: "Month first (US)" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                    (get("dateFormat") ?? "day-first") === opt.value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => set("dateFormat", opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Behavior */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Behavior</h3>
            <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm">Auto-complete todos</p>
                <p className="text-xs text-muted-foreground">
                  Complete a todo when all its checklist items are checked.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={get("autoCompleteTodo") === "1"}
                onClick={() =>
                  set(
                    "autoCompleteTodo",
                    get("autoCompleteTodo") === "1" ? "0" : "1",
                  )
                }
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  get("autoCompleteTodo") === "1"
                    ? "bg-primary"
                    : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                    get("autoCompleteTodo") === "1"
                      ? "translate-x-[18px]"
                      : "translate-x-0.5",
                  )}
                />
              </button>
            </label>
          </div>

          <Separator />

          {/* Sync server URL */}
          <div>
            <h3 className="mb-2 text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Sync Server
            </h3>
            <p className="mb-2 text-xs text-muted-foreground">
              WebSocket URL for Evolu sync. Leave empty to use the default
              server ({DEFAULT_SYNC_URL}). Changing this reloads the app.
            </p>
            <div className="space-y-2">
              <input
                type="url"
                value={syncUrl}
                onChange={(e) => handleSyncUrlChange(e.target.value)}
                placeholder={DEFAULT_SYNC_URL}
                className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {syncDirty && (
                <Button size="sm" className="w-full" onClick={handleSyncSave}>
                  Save & reload
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <p className="text-center text-[11px] text-muted-foreground">
            Build {__BUILD_VERSION__}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
