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
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    }
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const count = await importData(text);
        toast.success(`Imported ${count} records`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to import data",
        );
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleRestore = useCallback(async () => {
    const trimmed = restoreInput.trim();
    if (!trimmed) return;

    const result = Mnemonic.from(trimmed);
    if (!result.ok) {
      setRestoreError("Invalid recovery phrase. Please check and try again.");
      return;
    }

    await evolu.restoreAppOwner(result.value);
    // restoreAppOwner triggers a reload by default
  }, [restoreInput]);

  const handleScan = useCallback(
    (text: string) => {
      setScanMode(false);
      const result = Mnemonic.from(text);
      if (result.ok) {
        evolu.restoreAppOwner(result.value);
        return;
      }
      // Invalid QR: fall back to manual input with scanned text pre-filled
      setRestoreMode(true);
      setRestoreInput(text);
      setRestoreError("Scanned QR code is not a valid recovery phrase.");
    },
    [],
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
    // resetAppOwner triggers a reload by default
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Account & Sync</DialogTitle>
          <DialogDescription>
            Your data syncs automatically across devices using end-to-end
            encryption. Use your recovery phrase to access your data on a new
            device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recovery Phrase Section */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Recovery Phrase</h3>
            {!showMnemonic ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowMnemonic(true)}
              >
                Show recovery phrase
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-3">
                  <p className="font-mono text-xs leading-relaxed break-all select-all">
                    {mnemonic ?? "No mnemonic available"}
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
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy to clipboard
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
                      {showQrCode ? "Hide QR Code" : "Show QR Code"}
                    </Button>
                    {showQrCode && <QrCodeDisplay value={mnemonic} />}
                  </>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Keep this phrase safe. Anyone with it can access your data.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Data Section */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Data</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExport}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                {importing ? "Importing..." : "Import data"}
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
            <h3 className="mb-2 text-sm font-medium">Restore from another device</h3>
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
                  Enter recovery phrase
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setScanMode(true)}
                >
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  Scan QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter your 24-word recovery phrase..."
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
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleRestore}
                    disabled={!restoreInput.trim()}
                  >
                    Restore
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This will replace all local data with the restored account.
                </p>
              </div>
            )}
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

          {/* Danger Zone */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Danger Zone
            </h3>
            {!confirmReset ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmReset(true)}
              >
                Delete all data
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-destructive">
                  This will permanently delete all your data on this device and
                  create a new empty account. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleReset}
                  >
                    Delete everything
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
