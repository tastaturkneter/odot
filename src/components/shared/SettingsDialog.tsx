import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { SUPPORTED_LOCALES } from "@/i18n";
import {
  isSupported as notificationsSupported,
  getPermission,
  requestPermission,
  showNotification,
} from "@/lib/notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const upcomingOptions = [7, 14, 30] as const;

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { get, set } = useSettings();
  const t = useTranslation();

  const savedRange = get("upcomingRange");
  const daysAhead = savedRange ? parseInt(savedRange, 10) : 7;

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("settings.themeLight"), icon: Sun },
    { value: "system", label: t("settings.themeSystem"), icon: Monitor },
    { value: "dark", label: t("settings.themeDark"), icon: Moon },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>
            {t("settings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("settings.language")}</h3>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                    (get("locale") ?? "en") === loc.code
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => set("locale", loc.code)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Appearance */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("settings.appearance")}</h3>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {themes.map((th) => {
                const Icon = th.icon;
                return (
                  <button
                    key={th.value}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                      theme === th.value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTheme(th.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {th.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Upcoming range */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("settings.upcoming")}</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("settings.upcomingDescription")}
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

          {/* Surprise me range */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("settings.surpriseRange")}</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("settings.surpriseRangeDescription")}
            </p>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {([
                { value: "7", label: "7d" },
                { value: "14", label: "14d" },
                { value: "30", label: "30d" },
                { value: "90", label: "90d" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                    (get("surpriseRange") ?? "14") === opt.value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => set("surpriseRange", opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date format */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("settings.dateFormat")}</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("settings.dateFormatDescription")}
            </p>
            <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
              {([
                { value: "day-first", label: t("settings.dayFirst") },
                { value: "month-first", label: t("settings.monthFirst") },
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
          <div className="space-y-3">
            <h3 className="mb-2 text-sm font-medium">{t("settings.behavior")}</h3>

            {/* Completed todos visibility */}
            <div>
              <p className="mb-1 text-sm">{t("settings.completedTodos")}</p>
              <p className="mb-2 text-xs text-muted-foreground">
                {t("settings.completedDescription")}
              </p>
              <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
                {([
                  { value: "hide", label: t("settings.completedHide") },
                  { value: "show", label: t("settings.completedShow") },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                      (get("completedVisibility") ?? "hide") === opt.value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => set("completedVisibility", opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm">{t("settings.autoCompleteTodos")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.autoCompleteDescription")}
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

          {notificationsSupported() && (
            <>
              <Separator />
              <NotificationSettings />
            </>
          )}

          <Separator />

          <p className="text-center text-[11px] text-muted-foreground">
            Build {__BUILD_VERSION__}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationSettings() {
  const { get, set } = useSettings();
  const t = useTranslation();
  const [permission, setPermission] = useState(getPermission);

  const enabled = get("notificationsEnabled") === "1";
  const notificationTime = get("notificationTime") ?? "09:00";

  useEffect(() => {
    setPermission(getPermission());
  }, [enabled]);

  async function handleToggle() {
    if (!enabled) {
      if (getPermission() === "default") {
        const result = await requestPermission();
        setPermission(result);
        if (result !== "granted") return;
      } else if (getPermission() === "denied") {
        return;
      }
      set("notificationsEnabled", "1");
    } else {
      set("notificationsEnabled", "0");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="mb-2 text-sm font-medium">
        <Bell className="mr-1.5 inline-block h-3.5 w-3.5" />
        {t("settings.notifications")}
      </h3>
      <p className="text-xs text-muted-foreground">
        {t("settings.notificationsDescription")}
      </p>

      {/* Enable toggle */}
      <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
        <p className="text-sm">{t("settings.notificationsEnable")}</p>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
              enabled ? "translate-x-[18px]" : "translate-x-0.5",
            )}
          />
        </button>
      </label>

      {/* Permission hint */}
      {enabled && permission === "denied" && (
        <p className="text-xs text-destructive">
          {t("settings.notificationsBlocked")}
        </p>
      )}

      {/* Frequency */}
      <div className={cn(!enabled && "opacity-50")}>
        <p className="mb-2 text-sm">{t("settings.notificationsFrequency")}</p>
        <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
          {([
            { value: "1", label: "1h" },
            { value: "2", label: "2h" },
            { value: "6", label: "6h" },
            { value: "24", label: "24h" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              disabled={!enabled}
              className={`flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors ${
                (get("notificationFrequency") ?? "24") === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => set("notificationFrequency", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time picker */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
          !enabled && "opacity-50",
        )}
      >
        <p className="text-sm">{t("settings.notificationsTime")}</p>
        <input
          type="time"
          disabled={!enabled}
          value={notificationTime}
          onChange={(e) => set("notificationTime", e.target.value)}
          className="rounded border bg-transparent px-2 py-0.5 text-sm"
        />
      </div>

      {/* Test button */}
      {enabled && permission === "granted" && (
        <button
          className="w-full rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            showNotification("odot", { body: "Test notification" });
          }}
        >
          {t("settings.notificationsTest")}
        </button>
      )}
    </div>
  );
}
