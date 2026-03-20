import { StrictMode, Suspense, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "./db/evolu";
import App from "./App";
import "./index.css";

function LoadingFallback() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground">Laden...</p>
      {slow && (
        <div className="max-w-xs text-center text-xs text-muted-foreground">
          <p>
            Die Datenbank lässt sich nicht initialisieren. Dein Browser
            unterstützt möglicherweise OPFS nicht im privaten Modus.
          </p>
          <button
            className="mt-3 underline"
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EvoluProvider value={evolu}>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </EvoluProvider>
  </StrictMode>,
);
