import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface QrCodeScannerProps {
  onScan: (text: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const READER_ID = "qr-reader";

export function QrCodeScanner({ onScan, onError, onCancel }: QrCodeScannerProps) {
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(READER_ID);
    let running = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          scanner.stop().catch(() => {});
          running = false;
          onScanRef.current(decodedText);
        },
        () => {},
      )
      .then(() => {
        running = true;
        if (cancelled) {
          scanner.stop().catch(() => {});
          running = false;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onErrorRef.current(
            err instanceof Error ? err.message : "Could not access camera",
          );
        }
      });

    return () => {
      cancelled = true;
      if (running) {
        scanner.stop().catch(() => {});
        running = false;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div id={READER_ID} className="overflow-hidden rounded-md" />
      <Button variant="outline" size="sm" className="w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
