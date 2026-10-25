"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { getSupabase } from "@/lib/supabase";
import type { CafeTable } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { inputClass } from "./fields";

export function TablesAdmin() {
  const { t } = useI18n();
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [qr, setQr] = useState<Record<string, string>>({});
  const [label, setLabel] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getSupabase().from("tables").select("*").order("created_at");
    const list = (data as CafeTable[]) ?? [];
    setTables(list);
    const codes: Record<string, string> = {};
    for (const table of list) {
      codes[table.id] = await QRCode.toDataURL(tableUrl(table), { width: 512, margin: 1 });
    }
    setQr(codes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await getSupabase().from("tables").insert({ label: label.trim() });
    setError(Boolean(error));
    if (!error) {
      setLabel("");
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await getSupabase().from("tables").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
        <form onSubmit={add} className="flex items-end gap-2">
          <label className="text-sm">
            {t.admin.tableLabel}
            <input required value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          </label>
          <button type="submit" className="rounded-lg bg-stone-800 px-4 py-2 font-semibold text-white">
            + {t.admin.newTable}
          </button>
        </form>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-lg border border-stone-300 bg-white px-4 py-2">
          {t.admin.printQr}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-700">{t.common.error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
        {tables.map((table) => (
          <div key={table.id} className="break-inside-avoid rounded-lg border border-stone-200 bg-white p-3 text-center">
            <div className="text-lg font-bold">{table.label}</div>
            {qr[table.id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr[table.id]} alt={`QR ${table.label}`} className="mx-auto my-2 w-full max-w-48" />
            )}
            <div className="flex justify-center gap-3 text-sm print:hidden">
              <a href={tableUrl(table)} target="_blank" rel="noreferrer" className="underline">
                {t.admin.openLink}
              </a>
              <button type="button" onClick={() => remove(table.id)} className="text-red-700 underline">
                {t.common.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function tableUrl(table: CafeTable) {
  return `${window.location.origin}/t/${table.qr_token}`;
}
