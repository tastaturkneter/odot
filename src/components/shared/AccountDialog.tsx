import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  Download,
  Upload,
  QrCode,
  Camera,
  Globe,
} from "lucide-react";
import { evolu, SYNC_URL_KEY, DEFAULT_SYNC_URL } from "@/db/evolu";
import { Mnemonic } from "@evolu/common";
import { exportData, importData } from "@/lib/exportImport";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { QrCodeDisplay } from "@/components/shared/QrCodeDisplay";
import { QrCodeScanner } from "@/components/shared/QrCodeScanner";
import { useTranslation } from "@/hooks/useTranslation";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStoredSyncUrl(): string {
  try {
    return localStorage.getItem(SYNC_URL_KEY) || "";
  } catch {
    return "";
  }
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const t = useTranslation();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [restoreMode, setRestoreMode] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncUrl, setSyncUrl] = useState(getStoredSyncUrl);
  const [syncDirty, setSyncDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    evolu.appOwner.then((owner) => {
      setMnemonic(owner.mnemonic ?? null);
    });
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowMnemonic(false);
      setCopied(false);
      setShowQrCode(false);
      setRestoreMode(false);
      setScanMode(false);
      setRestoreInput("");
      setRestoreError(null);
      setConfirmReset(false);
      setImporting(false);
      setSyncUrl(getStoredSyncUrl());
      setSyncDirty(false);
    }
  }, [open]);

  const handleCopy = useCallback(() => {
    if (!mnemonic) return;
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mnemonic]);

  const handleExport = useCallback(async () => {
    try {
      await exportData();
      toast.success(t("account.exportSuccess"));
    } catch {
      toast.error(t("account.exportError"));
    }
  }, [t]);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const count = await importData(text);
        toast.success(t("account.importedCount", { count }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("account.importError"),
        );
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [t],
  );

  const handleRestore = useCallback(async () => {
    const trimmed = restoreInput.trim();
    if (!trimmed) return;

    const result = Mnemonic.from(trimmed);
    if (!result.ok) {
      setRestoreError(t("account.invalidPhrase"));
      return;
    }

    await evolu.restoreAppOwner(result.value);
  }, [restoreInput, t]);

  const handleScan = useCallback(
    (text: string) => {
      setScanMode(false);
      const result = Mnemonic.from(text);
      if (result.ok) {
        evolu.restoreAppOwner(result.value);
        return;
      }
      setRestoreMode(true);
      setRestoreInput(text);
      setRestoreError(t("account.invalidQrPhrase"));
    },
    [t],
  );

  const handleScanError = useCallback((error: string) => {
    setScanMode(false);
    toast.error(error);
  }, []);

  const handleScanCancel = useCallback(() => {
    setScanMode(false);
  }, []);

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

  const handleReset = useCallback(async () => {
    await evolu.resetAppOwner();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("account.title")}</DialogTitle>
          <DialogDescription>
            {t("account.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recovery Phrase Section */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("account.recoveryPhrase")}</h3>
            {!showMnemonic ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowMnemonic(true)}
              >
                {t("account.showRecoveryPhrase")}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-3">
                  <p className="font-mono text-xs leading-relaxed break-all select-all">
                    {mnemonic ?? t("account.noMnemonic")}
                  </p>
                </div>
                {mnemonic && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t("account.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          {t("account.copyToClipboard")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQrCode((v) => !v)}
                      className="w-full"
                    >
                      <QrCode className="mr-1 h-3.5 w-3.5" />
                      {showQrCode ? t("account.hideQrCode") : t("account.showQrCode")}
                    </Button>
                    {showQrCode && <QrCodeDisplay value={mnemonic} />}
                  </>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {t("account.keepPhraseSafe")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Data Section */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("account.data")}</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExport}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                {t("account.exportData")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                {importing ? t("account.importing") : t("account.importData")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          <Separator />

          {/* Restore Section */}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("account.restore")}</h3>
            {scanMode ? (
              <QrCodeScanner
                onScan={handleScan}
                onError={handleScanError}
                onCancel={handleScanCancel}
              />
            ) : !restoreMode ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setRestoreMode(true)}
                >
                  {t("account.enterRecoveryPhrase")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setScanMode(true)}
                >
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  {t("account.scanQrCode")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder={t("account.restorePlaceholder")}
                  value={restoreInput}
                  onChange={(e) => {
                    setRestoreInput(e.target.value);
                    setRestoreError(null);
                  }}
                  rows={3}
                  className="font-mono text-xs"
                />
                {restoreError && (
                  <p className="text-xs text-destructive">{restoreError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setRestoreMode(false);
                      setRestoreInput("");
                      setRestoreError(null);
                    }}
                  >
                    {t("account.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleRestore}
                    disabled={!restoreInput.trim()}
                  >
                    {t("account.restoreButton")}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("account.restoreWarning")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Sync server URL */}
          <div>
            <h3 className="mb-2 text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {t("account.syncServer")}
            </h3>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("account.syncServerDescription", { url: DEFAULT_SYNC_URL })}
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
                  {t("account.saveAndReload")}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("account.dangerZone")}
            </h3>
            {!confirmReset ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmReset(true)}
              >
                {t("account.deleteAllData")}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-destructive">
                  {t("account.deleteWarning")}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmReset(false)}
                  >
                    {t("account.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleReset}
                  >
                    {t("account.deleteEverything")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
