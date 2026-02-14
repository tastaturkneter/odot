import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "./db/evolu";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EvoluProvider value={evolu}>
      <App />
    </EvoluProvider>
  </StrictMode>,
);
