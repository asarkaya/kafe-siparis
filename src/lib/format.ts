import type { Locale } from "@/i18n/config";
import type { LocalizedText } from "@/lib/types";

const INTL_LOCALE: Record<Locale, string> = { de: "de-DE", tr: "tr-TR", en: "en-GB" };

export function formatPrice(cents: number, locale: Locale) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

export function formatTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

// Text in der gewählten Sprache, sonst Deutsch als Fallback
export function localized(text: LocalizedText | null | undefined, locale: Locale) {
  if (!text) return "";
  return text[locale]?.trim() || text.de || "";
}
