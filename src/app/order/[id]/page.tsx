"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, localized } from "@/lib/format";
import type { LocalizedText, OrderStatus } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

type PublicOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  table_label: string | null;
  total_cents: number;
  items: { name: LocalizedText; quantity: number; unit_price_cents: number; note: string | null }[];
};

const STEPS: OrderStatus[] = ["new", "preparing", "ready", "served"];

function OrderStatusView() {
  const { id } = useParams<{ id: string }>();
  const tableToken = useSearchParams().get("t");
  const { locale, t } = useI18n();
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const load = () =>
      getSupabase()
        .rpc("get_order_public", { p_order_id: id })
        .then(({ data }) => active && setOrder((data as PublicOrder) ?? null));
    load();
    // Status alle 5 Sekunden aktualisieren
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  if (order === undefined) return <p className="text-center text-stone-500">{t.common.loading}</p>;
  if (order === null) return <p className="text-center text-red-700">{t.order.notFound}</p>;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div>
      <p className="rounded-lg bg-green-50 p-4 text-green-900">{t.order.thanks}</p>
      <h1 className="mt-6 text-2xl font-bold">
        {t.order.number} {order.order_number}
      </h1>
      {order.table_label && <p className="text-stone-500">{order.table_label}</p>}

      {order.status === "cancelled" ? (
        <p className="mt-6 font-semibold text-red-700">{t.status.cancelled}</p>
      ) : (
        <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded-lg px-1 py-2 font-medium ${
                i <= stepIndex ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-500"
              }`}
            >
              {t.status[s]}
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between p-3">
            <span>
              {item.quantity}× {localized(item.name, locale)}
            </span>
            <span>{formatPrice(item.quantity * item.unit_price_cents, locale)}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 font-bold">
          <span>{t.cart.total}</span>
          <span>{formatPrice(order.total_cents, locale)}</span>
        </li>
      </ul>
      <p className="mt-2 text-sm text-stone-500">{t.cart.payAtCounter}</p>

      {tableToken && (
        <Link
          href={`/t/${encodeURIComponent(tableToken)}`}
          className="mt-6 inline-block rounded-lg border border-stone-800 px-5 py-2 font-semibold"
        >
          {t.order.orderMore}
        </Link>
      )}
    </div>
  );
}

export default function OrderPage() {
  const { t } = useI18n();
  return (
    <>
      <Header subtitle={t.order.title} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <Suspense>
          <OrderStatusView />
        </Suspense>
      </main>
    </>
  );
}
