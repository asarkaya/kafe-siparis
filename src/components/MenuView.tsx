"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { formatPrice, localized } from "@/lib/format";
import { ADDITIVES, ALLERGENS } from "@/lib/allergens";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onAdd?: (item: MenuItem) => void;
  quantities?: Record<string, number>;
};

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    Promise.all([
      supabase.from("menu_categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("menu_items").select("*").eq("active", true).order("sort_order"),
    ]).then(([c, i]) => {
      if (c.error || i.error) setError(true);
      setCategories((c.data as MenuCategory[]) ?? []);
      setItems((i.data as MenuItem[]) ?? []);
      setLoading(false);
    });
  }, []);

  return { categories, items, loading, error };
}

export function MenuView({ onAdd, quantities = {} }: Props) {
  const { locale, t } = useI18n();
  const { categories, items, loading, error } = useMenu();

  if (loading) return <p className="py-8 text-center text-stone-500">{t.common.loading}</p>;
  if (error) return <p className="py-8 text-center text-red-700">{t.common.error}</p>;
  if (items.length === 0) return <p className="py-8 text-center text-stone-500">{t.menu.empty}</p>;

  const usedAllergens = ALLERGENS.filter((a) => items.some((i) => i.allergens.includes(a)));
  const usedAdditives = ADDITIVES.filter((a) => items.some((i) => i.additives.includes(a)));

  return (
    <div>
      <nav className="sticky top-[61px] z-10 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-stone-50 px-4 py-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="whitespace-nowrap rounded-full border border-stone-300 bg-white px-3 py-1 text-sm"
          >
            {localized(c.name, locale)}
          </a>
        ))}
      </nav>

      {categories.map((c) => {
        const catItems = items.filter((i) => i.category_id === c.id);
        if (catItems.length === 0) return null;
        return (
          <section key={c.id} id={`cat-${c.id}`} className="mb-8 scroll-mt-28">
            <h2 className="mb-3 text-xl font-bold">{localized(c.name, locale)}</h2>
            <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
              {catItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {localized(item.name, locale)}
                        {item.additives.length > 0 && (
                          <sup className="ml-1 text-xs text-stone-500">{item.additives.join(",")}</sup>
                        )}
                      </div>
                      {localized(item.description, locale) && (
                        <p className="mt-1 text-sm text-stone-600">{localized(item.description, locale)}</p>
                      )}
                      {item.allergens.length > 0 && (
                        <p className="mt-1 text-xs text-stone-500">
                          {t.menu.allergens}:{" "}
                          {item.allergens
                            .map((a) => t.allergen[a as keyof typeof t.allergen] ?? a)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-semibold">{formatPrice(item.price_cents, locale)}</span>
                      {onAdd && (
                        <button
                          type="button"
                          onClick={() => onAdd(item)}
                          className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-700"
                        >
                          + {t.menu.add}
                          {quantities[item.id] ? ` (${quantities[item.id]})` : ""}
                        </button>
                      )}
                    </div>
                  </li>
              ))}
            </ul>
          </section>
        );
      })}

      {(usedAllergens.length > 0 || usedAdditives.length > 0) && (
        <details className="mb-8 rounded-lg border border-stone-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">{t.menu.legend}</summary>
          {usedAdditives.length > 0 && (
            <>
              <h3 className="mt-3 font-semibold">{t.menu.additives}</h3>
              <ul className="mt-1 text-stone-600">
                {usedAdditives.map((a) => (
                  <li key={a}>
                    {a} = {t.additive[a]}
                  </li>
                ))}
              </ul>
            </>
          )}
          {usedAllergens.length > 0 && (
            <>
              <h3 className="mt-3 font-semibold">{t.menu.allergens}</h3>
              <ul className="mt-1 text-stone-600">
                {usedAllergens.map((a) => (
                  <li key={a}>{t.allergen[a]}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}
    </div>
  );
}
