import { Header } from "./Header";
import { getLocale } from "@/i18n/server";

const NOTE = {
  de: null,
  tr: "Yasal metinler Almanca olarak geçerlidir.",
  en: "The legally binding version of this page is in German.",
};

export async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const note = NOTE[await getLocale()];
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {note && <p className="mb-6 rounded-lg bg-stone-200 p-3 text-sm">{note}</p>}
        <h1 className="mb-6 text-3xl font-bold">{title}</h1>
        <div className="space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold">{children}</div>
      </main>
    </>
  );
}
