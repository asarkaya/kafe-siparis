"use client";

import { Header } from "@/components/Header";
import { MenuView } from "@/components/MenuView";
import { NotConfigured } from "@/components/NotConfigured";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useI18n } from "@/i18n/I18nProvider";

export default function MenuPage() {
  const { t } = useI18n();
  return (
    <>
      <Header subtitle={t.menu.title} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <p className="mb-4 rounded-lg bg-stone-200 p-3 text-sm text-stone-700">{t.menu.viewOnly}</p>
        {isSupabaseConfigured ? <MenuView /> : <NotConfigured />}
      </main>
    </>
  );
}
