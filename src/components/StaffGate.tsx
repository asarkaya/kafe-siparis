"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useI18n } from "@/i18n/I18nProvider";
import { NotConfigured } from "./NotConfigured";

type Role = "admin" | "kitchen";

// Zeigt den Inhalt nur angemeldeten Mitarbeitenden (Tabelle public.staff).
export function StaffGate({
  require = "kitchen",
  children,
}: {
  require?: Role;
  children: (ctx: { role: Role; logout: () => void }) => React.ReactNode;
}) {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [role, setRole] = useState<Role | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    setRole(undefined);
    getSupabase()
      .from("staff")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setRole((data?.role as Role) ?? null));
  }, [session]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (session === undefined) return <p className="text-center text-stone-500">{t.common.loading}</p>;
  if (!session) return <LoginForm />;
  if (role === undefined) return <p className="text-center text-stone-500">{t.common.loading}</p>;

  const logout = () => getSupabase().auth.signOut();
  const allowed = role === "admin" || (role === "kitchen" && require === "kitchen");

  if (!allowed) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="text-red-700">{t.auth.noAccess}</p>
        <button type="button" onClick={logout} className="mt-4 underline">
          {t.auth.logout}
        </button>
      </div>
    );
  }

  return <>{children({ role: role!, logout })}</>;
}

function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    setError(Boolean(error));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded-lg border border-stone-200 bg-white p-6">
      <h1 className="text-xl font-bold">{t.auth.title}</h1>
      <label className="block text-sm">
        {t.auth.email}
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 p-2"
        />
      </label>
      <label className="block text-sm">
        {t.auth.password}
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 p-2"
        />
      </label>
      {error && <p className="text-sm text-red-700">{t.auth.failed}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-stone-800 py-2 font-semibold text-white disabled:opacity-50"
      >
        {t.auth.login}
      </button>
    </form>
  );
}
