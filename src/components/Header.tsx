import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const CAFE_NAME = process.env.NEXT_PUBLIC_CAFE_NAME || "Café";

export function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="min-w-0">
          <div className="truncate text-lg font-bold">{CAFE_NAME}</div>
          {subtitle && <div className="truncate text-sm text-stone-500">{subtitle}</div>}
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
