import { useCallback, useEffect } from "react";
import { useSettings } from "./useSettings";

export type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
  // Keep localStorage in sync for the flash-prevention script in index.html
  localStorage.setItem("theme", theme === "system" ? "" : theme);
}

export function useTheme() {
  const { get, set } = useSettings();
  const saved = get("theme");
  const theme: Theme =
    saved === "light" || saved === "dark" ? saved : "system";

  // Apply on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      set("theme", newTheme);
      applyTheme(newTheme);
    },
    [set],
  );

  return { theme, setTheme };
}
