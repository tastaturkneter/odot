import { QRCodeSVG } from "qrcode.react";

interface QrCodeDisplayProps {
  value: string;
}

export function QrCodeDisplay({ value }: QrCodeDisplayProps) {
  return (
    <div className="flex justify-center rounded-md p-4" style={{ backgroundColor: "#ffffff" }}>
      <QRCodeSVG value={value} size={200} level="M" />
    </div>
  );
}
