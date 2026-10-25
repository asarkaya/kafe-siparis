"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { StaffGate } from "@/components/StaffGate";
import { getSupabase } from "@/lib/supabase";
import { formatTime, localized } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

const COLUMNS: OrderStatus[] = ["new", "preparing", "ready"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { new: "preparing", preparing: "ready", ready: "served" };

export default function KitchenPage() {
  const { t } = useI18n();
  return (
    <>
      <Header subtitle={t.kitchen.title} />
      <main className="w-full flex-1 px-4 py-4">
        <StaffGate require="kitchen">{({ logout }) => <KitchenBoard onLogout={logout} />}</StaffGate>
      </main>
    </>
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function KitchenBoard({ onLogout }: { onLogout: () => void }) {
  const { locale, t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [sound, setSound] = useState(true);
  const knownIds = useRef<Set<string> | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("*, tables(label), order_items(*)")
      .in("status", COLUMNS)
      // Remote-Bestellungen erst nach erfolgreicher Zahlung anzeigen
      .or("type.eq.table,payment_status.eq.paid")
      .order("created_at");
    if (error || !data) return;
    const list = data as Order[];
    if (knownIds.current && soundRef.current && list.some((o) => !knownIds.current!.has(o.id))) beep();
    knownIds.current = new Set(list.map((o) => o.id));
    setOrders(list);
  }, []);

  useEffect(() => {
    load();
    const supabase = getSupabase();
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") load();
      });
    // Sicherheitsnetz, falls ein Realtime-Ereignis verloren geht
    const timer = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Bildschirm nicht ausschalten lassen (wenn vom Browser unterstützt)
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => {
      lock?.release();
    };
  }, []);

  async function setStatus(order: Order, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o)).filter((o) => COLUMNS.includes(o.status)),
    );
    const { error } = await getSupabase().from("orders").update({ status }).eq("id", order.id);
    if (error) load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <span className={`flex items-center gap-2 ${connected ? "text-green-700" : "text-amber-700"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-600" : "bg-amber-500"}`} />
          {connected ? t.kitchen.live : t.kitchen.offline}
        </span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          {t.kitchen.sound}
        </label>
        <button type="button" onClick={onLogout} className="ml-auto underline">
          {t.auth.logout}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col);
          return (
            <section key={col} className="rounded-xl bg-stone-200/60 p-3">
              <h2 className="mb-3 font-bold">
                {t.status[col]} ({colOrders.length})
              </h2>
              {colOrders.length === 0 && <p className="text-sm text-stone-500">{t.kitchen.empty}</p>}
              <div className="space-y-3">
                {colOrders.map((order) => (
                  <article key={order.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-bold">
                        #{order.order_number} · {order.type === "table" ? order.tables?.label : t.kitchen.remote}
                      </span>
                      <span className="text-sm text-stone-500">{formatTime(order.created_at, locale)}</span>
                    </div>
                    {order.customer_name && <div className="text-sm">{order.customer_name}</div>}
                    <ul className="mt-2 space-y-1">
                      {order.order_items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.quantity}×</span>{" "}
                          {localized(item.name_snapshot, locale)}
                          {item.note && <div className="text-sm text-amber-800">→ {item.note}</div>}
                        </li>
                      ))}
                    </ul>
                    {order.note && (
                      <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-900">{order.note}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {NEXT[col] && (
                        <button
                          type="button"
                          onClick={() => setStatus(order, NEXT[col]!)}
                          className="flex-1 rounded-lg bg-stone-800 py-2 font-semibold text-white"
                        >
                          {col === "new" ? t.kitchen.start : col === "preparing" ? t.kitchen.ready : t.kitchen.served}
                        </button>
                      )}
                      {col === "new" && (
                        <button
                          type="button"
                          onClick={() => confirm(t.kitchen.confirmCancel) && setStatus(order, "cancelled")}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
                        >
                          {t.kitchen.cancel}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
