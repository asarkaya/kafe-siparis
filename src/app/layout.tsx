import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getLocale } from "@/i18n/server";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_CAFE_NAME || "Café",
  description: "Bestellen am Tisch",
};

export const viewport: Viewport = {
  themeColor: "#292524",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col bg-stone-50 text-stone-900 antialiased">
        <I18nProvider locale={locale}>
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
