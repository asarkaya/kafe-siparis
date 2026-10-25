"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { StaffGate } from "@/components/StaffGate";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { TablesAdmin } from "@/components/admin/TablesAdmin";
import { useI18n } from "@/i18n/I18nProvider";

export default function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"menu" | "tables">("menu");
  return (
    <>
      <Header subtitle={t.admin.title} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
        <StaffGate require="admin">
          {({ logout }) => (
            <>
              <div className="mb-6 flex items-center gap-2 print:hidden">
                {(["menu", "tables"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-lg px-4 py-2 font-semibold ${
                      tab === key ? "bg-stone-800 text-white" : "bg-white text-stone-700"
                    }`}
                  >
                    {t.admin[key]}
                  </button>
                ))}
                <button type="button" onClick={logout} className="ml-auto text-sm underline">
                  {t.auth.logout}
                </button>
              </div>
              {tab === "menu" ? <MenuAdmin /> : <TablesAdmin />}
            </>
          )}
        </StaffGate>
      </main>
    </>
  );
}
