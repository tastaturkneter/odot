import en, { type TranslationKeys, type Translations } from "./en";
import de from "./de";

declare global {
  interface Window {
    __ODOT_LOCALE__?: string;
  }
}

const locales: Record<string, Translations> = {
  en,
  de,
};

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
] as const;

export function resolveLocale(userSetting: string | null): string {
  if (userSetting && userSetting in locales) return userSetting;

  const envLocale = typeof window !== "undefined" ? window.__ODOT_LOCALE__ : undefined;
  if (envLocale && envLocale in locales) return envLocale;

  if (typeof navigator !== "undefined" && navigator.language) {
    const lang = navigator.language.split("-")[0];
    if (lang && lang in locales) return lang;
  }

  return "en";
}

export function getTranslations(locale: string): Translations {
  return locales[locale] ?? en;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  );
}

export type { TranslationKeys, Translations };
