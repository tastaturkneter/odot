import { useState, useEffect, useCallback } from "react";
import { Check, Copy, Globe, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { SUPPORTED_LOCALES } from "@/i18n";
import { evolu, SYNC_URL_KEY, DEFAULT_SYNC_URL } from "@/db/evolu";
import { Mnemonic } from "@evolu/common";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { seedDemoData } from "@/lib/seedDemoData";

const SETUP_COMPLETE_KEY = "odot-setup-complete";

export function isSetupComplete(): boolean {
  try {
    return localStorage.getItem(SETUP_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSetupComplete(): void {
  try {
    localStorage.setItem(SETUP_COMPLETE_KEY, "1");
  } catch {
    // ignore
  }
}

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = "language" | "sync" | "account";
const STEPS: Step[] = ["language", "sync", "account"];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [wantsDemoData, setWantsDemoData] = useState(false);
  const step = STEPS[currentStep];

  async function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // If user entered a recovery phrase, restore automatically
      const trimmed = restoreInput.trim();
      if (trimmed) {
        const result = Mnemonic.from(trimmed);
        if (!result.ok) {
          setRestoreError("Invalid recovery phrase");
          return;
        }
        markSetupComplete();
        await evolu.restoreAppOwner(result.value);
        return; // restoreAppOwner reloads the app
      }

      if (wantsDemoData) {
        seedDemoData(evolu);
      }

      markSetupComplete();
      // If user set a custom sync URL, we need to reload so Evolu picks it up
      const customUrl = localStorage.getItem(SYNC_URL_KEY);
      if (customUrl && customUrl !== DEFAULT_SYNC_URL) {
        window.location.reload();
        return;
      }
      onComplete();
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="mx-4 w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === currentStep
                  ? "bg-primary"
                  : i < currentStep
                    ? "bg-primary/40"
                    : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === "language" && <LanguageStep />}
        {step === "sync" && <SyncStep />}
        {step === "account" && (
          <AccountStep
            restoreInput={restoreInput}
            onRestoreInputChange={(v) => {
              setRestoreInput(v);
              setRestoreError(null);
            }}
            restoreError={restoreError}
            wantsDemoData={wantsDemoData}
            onWantsDemoDataChange={setWantsDemoData}
          />
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              <BackLabel />
            </Button>
          ) : (
            <div />
          )}
          <div className="flex-1" />
          <Button onClick={handleNext} className="gap-1">
            {currentStep < STEPS.length - 1 ? <NextLabel /> : <FinishLabel />}
            {currentStep < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BackLabel() {
  const t = useTranslation();
  return <>{t("setup.back")}</>;
}

function NextLabel() {
  const t = useTranslation();
  return <>{t("setup.next")}</>;
}

function FinishLabel() {
  const t = useTranslation();
  return <>{t("setup.finish")}</>;
}

function LanguageStep() {
  const { get, set } = useSettings();
  const { theme, setTheme } = useTheme();
  const t = useTranslation();

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("settings.themeLight"), icon: Sun },
    { value: "system", label: t("settings.themeSystem"), icon: Monitor },
    { value: "dark", label: t("settings.themeDark"), icon: Moon },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("setup.welcome")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("setup.welcomeDescription")}
        </p>
      </div>

      {/* Language */}
      <div>
        <h3 className="mb-2 text-sm font-medium">{t("settings.language")}</h3>
        <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc.code}
              className={cn(
                "flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors",
                (get("locale") ?? "en") === loc.code
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => set("locale", loc.code)}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div>
        <h3 className="mb-2 text-sm font-medium">
          {t("settings.appearance")}
        </h3>
        <div className="flex items-center justify-center gap-0.5 rounded-md border p-0.5">
          {themes.map((th) => {
            const Icon = th.icon;
            return (
              <button
                key={th.value}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors",
                  theme === th.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setTheme(th.value)}
              >
                <Icon className="h-3.5 w-3.5" />
                {th.label}
              </button>
            );
          })}
        </div>
      </div>

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
              className={cn(
                "flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm transition-colors",
                (get("dateFormat") ?? "day-first") === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => set("dateFormat", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncStep() {
  const t = useTranslation();
  const [syncUrl, setSyncUrl] = useState(() => {
    try {
      return localStorage.getItem(SYNC_URL_KEY) || "";
    } catch {
      return "";
    }
  });

  function handleSyncUrlChange(value: string) {
    setSyncUrl(value);
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(SYNC_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(SYNC_URL_KEY);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Globe className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">{t("setup.syncTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("setup.syncDescription")}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("account.syncServer")}
        </label>
        <input
          type="url"
          value={syncUrl}
          onChange={(e) => handleSyncUrlChange(e.target.value)}
          placeholder={DEFAULT_SYNC_URL}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("account.syncServerDescription", { url: DEFAULT_SYNC_URL })}
        </p>
      </div>
    </div>
  );
}

interface AccountStepProps {
  restoreInput: string;
  onRestoreInputChange: (value: string) => void;
  restoreError: string | null;
  wantsDemoData: boolean;
  onWantsDemoDataChange: (value: boolean) => void;
}

function AccountStep({
  restoreInput,
  onRestoreInputChange,
  restoreError,
  wantsDemoData,
  onWantsDemoDataChange,
}: AccountStepProps) {
  const t = useTranslation();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [restoreMode, setRestoreMode] = useState(false);

  useEffect(() => {
    evolu.appOwner.then((owner) => {
      setMnemonic(owner.mnemonic ?? null);
    });
  }, []);

  const handleCopy = useCallback(() => {
    if (!mnemonic) return;
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mnemonic]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("setup.accountTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("setup.accountDescription")}
        </p>
      </div>

      {!restoreMode ? (
        <div className="space-y-4">
          {/* Show mnemonic */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("setup.accountNewDescription")}
            </p>
            <div className="rounded-md bg-muted p-3">
              <p className="font-mono text-xs leading-relaxed break-all select-all">
                {mnemonic ?? "..."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                {t("setup.accountCopied")}
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3.5 w-3.5" />
                {t("setup.accountCopy")}
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              className="text-sm text-muted-foreground underline hover:text-foreground"
              onClick={() => setRestoreMode(true)}
            >
              {t("setup.accountRestoreButton")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t("setup.accountRestoreDescription")}
          </p>
          <Textarea
            placeholder={t("account.restorePlaceholder")}
            value={restoreInput}
            onChange={(e) => onRestoreInputChange(e.target.value)}
            rows={3}
            className="font-mono text-xs"
          />
          {restoreError && (
            <p className="text-xs text-destructive">{restoreError}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setRestoreMode(false);
              onRestoreInputChange("");
            }}
          >
            {t("account.cancel")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            {t("account.restoreWarning")}
          </p>
        </div>
      )}

      {/* Demo data toggle */}
      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
        <input
          type="checkbox"
          checked={wantsDemoData}
          onChange={(e) => onWantsDemoDataChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
        />
        <div>
          <p className="text-sm font-medium">{t("setup.demoData")}</p>
          <p className="text-xs text-muted-foreground">
            {t("setup.demoDataDescription")}
          </p>
        </div>
      </label>
    </div>
  );
}
