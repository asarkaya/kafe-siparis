"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-stone-200 py-6 text-center text-sm text-stone-500 print:hidden">
      <Link href="/impressum" className="hover:underline">
        {t.footer.imprint}
      </Link>
      <span className="mx-3">·</span>
      <Link href="/datenschutz" className="hover:underline">
        {t.footer.privacy}
      </Link>
    </footer>
  );
}
