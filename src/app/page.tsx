import Link from "next/link";
import { Header } from "@/components/Header";
import { getLocale } from "@/i18n/server";
import { dictionaries } from "@/i18n/dictionaries";

export default async function Home() {
  const t = dictionaries[await getLocale()];
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">{t.home.title}</h1>
        <p className="mt-4 text-lg text-stone-600">{t.home.scanQr}</p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-lg bg-stone-800 px-6 py-3 font-semibold text-white hover:bg-stone-700"
        >
          {t.home.viewMenu}
        </Link>
        <div className="mt-16 text-sm text-stone-500">
          {t.home.staff}:{" "}
          <Link href="/kitchen" className="underline">
            {t.home.kitchen}
          </Link>
          {" · "}
          <Link href="/admin" className="underline">
            {t.home.admin}
          </Link>
        </div>
      </main>
    </>
  );
}
