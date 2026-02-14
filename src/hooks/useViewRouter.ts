import { useCallback, useEffect, useState } from "react";
import type { ActiveView } from "@/lib/views";
import { pathToView, viewToPath } from "@/lib/views";

export function useViewRouter(): [ActiveView, (view: ActiveView) => void] {
  const [activeView, setActiveViewState] = useState<ActiveView>(() =>
    pathToView(window.location.pathname),
  );

  const setActiveView = useCallback((view: ActiveView) => {
    setActiveViewState(view);
    history.pushState(null, "", viewToPath(view));
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveViewState(pathToView(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Sync initial URL: if user lands on `/`, replace with `/inbox`
  useEffect(() => {
    if (window.location.pathname === "/") {
      history.replaceState(null, "", "/inbox");
    }
  }, []);

  return [activeView, setActiveView];
}
