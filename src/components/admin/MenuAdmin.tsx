"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { formatPrice, localized } from "@/lib/format";
import { ADDITIVES, ALLERGENS } from "@/lib/allergens";
import type { LocalizedText, MenuCategory, MenuItem } from "@/lib/types";
import { useI18n } from "@/i18n/I18nProvider";
import { LocalizedInput, cleanText, inputClass } from "./fields";

type CategoryDraft = { id?: string; name: LocalizedText; sort_order: number; active: boolean };
type ItemDraft = {
  id?: string;
  category_id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: string;
  allergens: string[];
  additives: string[];
  sort_order: number;
  active: boolean;
};

export function MenuAdmin() {
  const { locale, t } = useI18n();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<CategoryDraft | null>(null);
  const [item, setItem] = useState<ItemDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [c, i] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    setCategories((c.data as MenuCategory[]) ?? []);
    setItems((i.data as MenuItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    const row = { name: cleanText(category.name), sort_order: category.sort_order, active: category.active };
    if (!row.name.de) return setError(t.admin.germanRequired);
    const supabase = getSupabase();
    const { error } = category.id
      ? await supabase.from("menu_categories").update(row).eq("id", category.id)
      : await supabase.from("menu_categories").insert(row);
    if (error) return setError(t.common.error);
    setError(null);
    setCategory(null);
    load();
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const price = Math.round(parseFloat(item.price.replace(",", ".")) * 100);
    const row = {
      category_id: item.category_id,
      name: cleanText(item.name),
      description: cleanText(item.description),
      price_cents: price,
      allergens: item.allergens,
      additives: item.additives,
      sort_order: item.sort_order,
      active: item.active,
    };
    if (!row.name.de) return setError(t.admin.germanRequired);
    if (!Number.isFinite(price) || price < 0) return setError(t.common.error);
    const supabase = getSupabase();
    const { error } = item.id
      ? await supabase.from("menu_items").update(row).eq("id", item.id)
      : await supabase.from("menu_items").insert(row);
    if (error) return setError(t.common.error);
    setError(null);
    setItem(null);
    load();
  }

  async function remove(table: "menu_categories" | "menu_items", id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await getSupabase().from(table).delete().eq("id", id);
    load();
  }

  function newItem(categoryId: string) {
    setCategory(null);
    setItem({
      category_id: categoryId,
      name: {},
      description: {},
      price: "",
      allergens: [],
      additives: [],
      sort_order: items.filter((i) => i.category_id === categoryId).length + 1,
      active: true,
    });
  }

  function editItem(i: MenuItem) {
    setCategory(null);
    setItem({
      id: i.id,
      category_id: i.category_id,
      name: i.name,
      description: i.description ?? {},
      price: (i.price_cents / 100).toFixed(2).replace(".", ","),
      allergens: i.allergens,
      additives: i.additives,
      sort_order: i.sort_order,
      active: i.active,
    });
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.admin.categories}</h2>
          <button
            type="button"
            onClick={() => {
              setItem(null);
              setCategory({ name: {}, sort_order: categories.length + 1, active: true });
            }}
            className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-semibold text-white"
          >
            + {t.admin.newCategory}
          </button>
        </div>

        {categories.length === 0 && <p className="text-stone-500">{t.admin.noCategories}</p>}

        <div className="space-y-6">
          {categories.map((c) => (
            <section key={c.id} className="rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center gap-2 border-b border-stone-200 p-3">
                <h3 className={`flex-1 font-bold ${c.active ? "" : "text-stone-400 line-through"}`}>
                  {localized(c.name, locale)}
                </h3>
                <button type="button" onClick={() => newItem(c.id)} className="text-sm underline">
                  + {t.admin.newItem}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItem(null);
                    setCategory({ id: c.id, name: c.name, sort_order: c.sort_order, active: c.active });
                  }}
                  className="text-sm underline"
                >
                  {t.common.edit}
                </button>
                <button type="button" onClick={() => remove("menu_categories", c.id)} className="text-sm text-red-700 underline">
                  {t.common.delete}
                </button>
              </div>
              <ul className="divide-y divide-stone-100">
                {items
                  .filter((i) => i.category_id === c.id)
                  .map((i) => (
                    <li key={i.id} className="flex items-center gap-3 p-3 text-sm">
                      <span className={`flex-1 ${i.active ? "" : "text-stone-400 line-through"}`}>
                        {localized(i.name, locale)}
                      </span>
                      <span>{formatPrice(i.price_cents, locale)}</span>
                      <button type="button" onClick={() => editItem(i)} className="underline">
                        {t.common.edit}
                      </button>
                      <button type="button" onClick={() => remove("menu_items", i.id)} className="text-red-700 underline">
                        {t.common.delete}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div>
        {category && (
          <form onSubmit={saveCategory} className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 lg:sticky lg:top-20">
            <h2 className="text-lg font-bold">{category.id ? t.common.edit : t.admin.newCategory}</h2>
            <LocalizedInput label={t.admin.name} value={category.name} onChange={(name) => setCategory({ ...category, name })} required />
            <label className="block text-sm">
              {t.admin.sortOrder}
              <input
                type="number"
                value={category.sort_order}
                onChange={(e) => setCategory({ ...category, sort_order: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={category.active} onChange={(e) => setCategory({ ...category, active: e.target.checked })} />
              {t.admin.active}
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <FormButtons onCancel={() => setCategory(null)} />
          </form>
        )}

        {item && (
          <form onSubmit={saveItem} className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 lg:sticky lg:top-20">
            <h2 className="text-lg font-bold">{item.id ? t.common.edit : t.admin.newItem}</h2>
            <label className="block text-sm">
              {t.admin.category}
              <select
                value={item.category_id}
                onChange={(e) => setItem({ ...item, category_id: e.target.value })}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {localized(c.name, locale)}
                  </option>
                ))}
              </select>
            </label>
            <LocalizedInput label={t.admin.name} value={item.name} onChange={(name) => setItem({ ...item, name })} required />
            <LocalizedInput
              label={t.admin.description}
              value={item.description}
              onChange={(description) => setItem({ ...item, description })}
              multiline
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                {t.admin.price}
                <input
                  inputMode="decimal"
                  required
                  placeholder="3,50"
                  value={item.price}
                  onChange={(e) => setItem({ ...item, price: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                {t.admin.sortOrder}
                <input
                  type="number"
                  value={item.sort_order}
                  onChange={(e) => setItem({ ...item, sort_order: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">{t.menu.allergens}</legend>
              <div className="mt-1 grid grid-cols-2 gap-1 text-sm">
                {ALLERGENS.map((a) => (
                  <label key={a} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.allergens.includes(a)}
                      onChange={() => setItem({ ...item, allergens: toggle(item.allergens, a) })}
                    />
                    {t.allergen[a]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium">{t.menu.additives}</legend>
              <div className="mt-1 grid grid-cols-1 gap-1 text-sm">
                {ADDITIVES.map((a) => (
                  <label key={a} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.additives.includes(a)}
                      onChange={() => setItem({ ...item, additives: toggle(item.additives, a) })}
                    />
                    {a} – {t.additive[a]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.active} onChange={(e) => setItem({ ...item, active: e.target.checked })} />
              {t.admin.active}
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <FormButtons onCancel={() => setItem(null)} />
          </form>
        )}
      </div>
    </div>
  );
}

function FormButtons({ onCancel }: { onCancel: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      <button type="submit" className="flex-1 rounded-lg bg-stone-800 py-2 font-semibold text-white">
        {t.common.save}
      </button>
      <button type="button" onClick={onCancel} className="rounded-lg border border-stone-300 px-4 py-2">
        {t.common.cancel}
      </button>
    </div>
  );
}
