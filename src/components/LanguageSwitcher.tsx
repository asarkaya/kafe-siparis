"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div role="group" aria-label={t.common.language} className="flex gap-1 text-sm">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === locale}
          title={LOCALE_LABELS[l]}
          className={`rounded-md px-2 py-1 font-medium uppercase ${
            l === locale ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
