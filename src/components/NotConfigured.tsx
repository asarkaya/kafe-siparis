"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function NotConfigured() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      {t.common.notConfigured}
    </div>
  );
}
