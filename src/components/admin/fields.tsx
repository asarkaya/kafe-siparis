"use client";

import { LOCALES } from "@/i18n/config";
import type { LocalizedText } from "@/lib/types";

export const inputClass = "mt-1 w-full rounded-lg border border-stone-300 p-2";

// Eingabefelder für einen Text in allen drei Sprachen
export function LocalizedInput({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {LOCALES.map((l) => (
        <label key={l} className="flex items-start gap-2 text-sm">
          <span className="mt-3 w-7 font-semibold uppercase text-stone-500">{l}</span>
          {multiline ? (
            <textarea
              rows={2}
              value={value[l] ?? ""}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              className={inputClass}
            />
          ) : (
            <input
              value={value[l] ?? ""}
              required={required && l === "de"}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              className={inputClass}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}

// Leere Übersetzungen nicht speichern
export function cleanText(value: LocalizedText): LocalizedText {
  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [k, (v ?? "").trim()])
      .filter(([, v]) => v),
  );
}
