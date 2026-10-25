"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { MenuView } from "@/components/MenuView";
import { NotConfigured } from "@/components/NotConfigured";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, localized } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

type CartLine = { item: MenuItem; quantity: number };

export default function TableOrderPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { locale, t } = useI18n();

  const [table, setTable] = useState<{ id: string; label: string } | null | undefined>(undefined);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [note, setNote] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const storageKey = `cart:${token}`;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getSupabase()
      .rpc("get_table_by_token", { p_token: token })
      .then(({ data }) => setTable(data?.[0] ?? null));
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [token, storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {}
  }, [cart, storageKey]);

  const lines = Object.values(cart);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = lines.reduce((s, l) => s + l.quantity * l.item.price_cents, 0);
  const quantities = Object.fromEntries(lines.map((l) => [l.item.id, l.quantity]));

  function changeQty(item: MenuItem, delta: number) {
    setCart((prev) => {
      const quantity = (prev[item.id]?.quantity ?? 0) + delta;
      const next = { ...prev };
      if (quantity <= 0) delete next[item.id];
      else next[item.id] = { item, quantity: Math.min(quantity, 50) };
      return next;
    });
  }

  async function placeOrder() {
    setSending(true);
    setError(false);
    const { data, error } = await getSupabase().rpc("place_table_order", {
      p_token: token,
      p_items: lines.map((l) => ({ menu_item_id: l.item.id, quantity: l.quantity })),
      p_note: note,
      p_locale: locale,
    });
    if (error || !data?.[0]) {
      setError(true);
      setSending(false);
      return;
    }
    setCart({});
    setNote("");
    router.push(`/order/${data[0].order_id}?t=${encodeURIComponent(token)}`);
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <Header />
        <main className="flex-1 p-4">
          <NotConfigured />
        </main>
      </>
    );
  }

  if (table === null) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-xl flex-1 p-8 text-center text-red-700">{t.menu.invalidTable}</main>
      </>
    );
  }

  return (
    <>
      <Header subtitle={table ? `${table.label}` : t.common.loading} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 pb-28">
        {table && <MenuView onAdd={(item) => changeQty(item, 1)} quantities={quantities} />}
      </main>

      {count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-stone-800 px-5 py-4 font-semibold text-white shadow-lg"
          >
            <span>
              {t.cart.showCart} ({count})
            </span>
            <span>{formatPrice(total, locale)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setCartOpen(false)}>
          <div
            className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t.cart.title}</h2>
              <button type="button" onClick={() => setCartOpen(false)} className="text-2xl leading-none" aria-label={t.common.back}>
                ×
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="text-stone-500">{t.cart.empty}</p>
            ) : (
              <ul className="divide-y divide-stone-200">
                {lines.map(({ item, quantity }) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className="font-medium">{localized(item.name, locale)}</div>
                      <div className="text-sm text-stone-500">{formatPrice(item.price_cents, locale)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeQty(item, -1)} className="h-8 w-8 rounded-full border border-stone-300">
                        −
                      </button>
                      <span className="w-6 text-center">{quantity}</span>
                      <button type="button" onClick={() => changeQty(item, 1)} className="h-8 w-8 rounded-full border border-stone-300">
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <label className="mt-4 block text-sm font-medium">
              {t.cart.note}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={t.cart.notePlaceholder}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2"
              />
            </label>

            <div className="mt-4 flex justify-between text-lg font-bold">
              <span>{t.cart.total}</span>
              <span>{formatPrice(total, locale)}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">{t.cart.payAtCounter}</p>

            {error && <p className="mt-3 text-red-700">{t.common.error}</p>}

            <button
              type="button"
              disabled={sending || lines.length === 0}
              onClick={placeOrder}
              className="mt-4 w-full rounded-xl bg-green-700 py-4 text-lg font-semibold text-white disabled:opacity-50"
            >
              {sending ? t.cart.ordering : t.cart.order}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
