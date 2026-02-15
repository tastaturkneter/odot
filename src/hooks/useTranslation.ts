import { useCallback } from "react";
import { useSettings } from "./useSettings";
import {
  resolveLocale,
  getTranslations,
  interpolate,
  type TranslationKeys,
} from "@/i18n";

export function useTranslation() {
  const { get } = useSettings();
  const locale = resolveLocale(get("locale"));
  const translations = getTranslations(locale);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>): string => {
      const template = translations[key] ?? key;
      return params ? interpolate(template, params) : template;
    },
    [translations],
  );

  return t;
}
