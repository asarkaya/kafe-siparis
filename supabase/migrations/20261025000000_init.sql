-- =============================================================
-- kafe-siparis: Grundschema (MVP)
-- Menü (mehrsprachig DE/TR/EN, Allergene + Zusatzstoffe),
-- Tische mit QR-Token, Bestellungen (Tisch / Remote), Personal.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Typen ----------
create type public.order_type as enum ('table', 'remote');

create type public.order_status as enum (
  'new',        -- eingegangen, Küche hat noch nicht begonnen
  'preparing',  -- in Zubereitung
  'ready',      -- fertig / abholbereit
  'served',     -- serviert / abgeholt (abgeschlossen)
  'cancelled'
);

-- Tischbestellungen werden an der Kasse (bestehendes Kassensystem) bezahlt:
-- 'pay_at_counter'. Remote-Bestellungen müssen online bezahlt sein ('paid'),
-- bevor sie in der Küche erscheinen.
create type public.payment_status as enum (
  'pay_at_counter',
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- ---------- Personal ----------
-- Nur Nutzer in dieser Tabelle dürfen Küche und Verwaltung benutzen.
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'kitchen')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin');
$$;

-- ---------- Menü ----------
-- Mehrsprachige Texte als JSON: {"de": "...", "tr": "...", "en": "..."}
-- Deutsch ist Pflicht, TR/EN optional (Fallback auf Deutsch).
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null check (coalesce(name ->> 'de', '') <> ''),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name jsonb not null check (coalesce(name ->> 'de', '') <> ''),
  description jsonb not null default '{}'::jsonb,
  price_cents int not null check (price_cents >= 0),
  -- EU-14 Hauptallergene (LMIV), z.B. {'gluten','milk'}
  allergens text[] not null default '{}',
  -- Kennzeichnungspflichtige Zusatzstoffe, z.B. {'1','11'}
  additives text[] not null default '{}',
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category_id);

-- ---------- Tische ----------
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  -- geheimer Token im QR-Code (/t/<qr_token>)
  qr_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Bestellungen ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  type public.order_type not null,
  table_id uuid references public.tables (id) on delete set null,
  status public.order_status not null default 'new',
  payment_status public.payment_status not null,
  customer_name text,
  note text check (char_length(note) <= 500),
  locale text not null default 'de' check (locale in ('de', 'tr', 'en')),
  total_cents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_order_has_table check (type <> 'table' or table_id is not null)
);

create index orders_status_idx on public.orders (status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  -- Name zum Zeitpunkt der Bestellung (alle Sprachen), falls das Gericht später geändert wird
  name_snapshot jsonb not null,
  unit_price_cents int not null,
  quantity int not null check (quantity between 1 and 50),
  note text check (char_length(note) <= 200)
);

create index order_items_order_idx on public.order_items (order_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.staff enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "staff sees own row" on public.staff
  for select to authenticated using (user_id = auth.uid());

-- Menü: öffentlich lesbar (nur aktive Einträge), Admin darf alles
create policy "menu categories public read" on public.menu_categories
  for select using (active or public.is_staff());
create policy "menu categories admin write" on public.menu_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "menu items public read" on public.menu_items
  for select using (active or public.is_staff());
create policy "menu items admin write" on public.menu_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tische: nur Personal (Token bleiben geheim)
create policy "tables staff read" on public.tables
  for select to authenticated using (public.is_staff());
create policy "tables admin write" on public.tables
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Bestellungen: Personal liest/aktualisiert. Gäste bestellen nur über die Funktionen unten.
create policy "orders staff read" on public.orders
  for select to authenticated using (public.is_staff());
create policy "orders staff update" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "order items staff read" on public.order_items
  for select to authenticated using (public.is_staff());

-- ---------- Funktionen für Gäste ----------

-- Tisch über QR-Token finden
create or replace function public.get_table_by_token(p_token text)
returns table (id uuid, label text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.label from public.tables t
  where t.qr_token = p_token and t.active;
$$;

-- Tischbestellung aufgeben. Preise werden serverseitig aus dem Menü berechnet.
-- p_items: [{"menu_item_id": "...", "quantity": 2, "note": "ohne Zwiebeln"}]
create or replace function public.place_table_order(
  p_token text,
  p_items jsonb,
  p_note text default null,
  p_locale text default 'de'
)
returns table (order_id uuid, order_number bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
  v_order public.orders;
  v_item jsonb;
  v_menu public.menu_items;
  v_qty int;
  v_total int := 0;
begin
  select t.id into v_table_id from public.tables t where t.qr_token = p_token and t.active;
  if v_table_id is null then
    raise exception 'invalid_table' using errcode = 'P0001';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  insert into public.orders (type, table_id, payment_status, note, locale)
  values (
    'table', v_table_id, 'pay_at_counter',
    nullif(left(trim(p_note), 500), ''),
    case when p_locale in ('de', 'tr', 'en') then p_locale else 'de' end
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;

    select * into v_menu from public.menu_items m
    where m.id = (v_item ->> 'menu_item_id')::uuid and m.active;
    if v_menu.id is null then
      raise exception 'item_unavailable' using errcode = 'P0001';
    end if;

    insert into public.order_items (order_id, menu_item_id, name_snapshot, unit_price_cents, quantity, note)
    values (v_order.id, v_menu.id, v_menu.name, v_menu.price_cents, v_qty,
            nullif(left(trim(v_item ->> 'note'), 200), ''));

    v_total := v_total + v_menu.price_cents * v_qty;
  end loop;

  update public.orders set total_cents = v_total where id = v_order.id;

  return query select v_order.id, v_order.order_number;
end;
$$;

-- Bestellstatus für den Gast (die Bestell-ID ist eine zufällige UUID)
create or replace function public.get_order_public(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'type', o.type,
    'table_label', t.label,
    'total_cents', o.total_cents,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.name_snapshot, 'quantity', oi.quantity,
        'unit_price_cents', oi.unit_price_cents, 'note', oi.note))
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  left join public.tables t on t.id = o.table_id
  where o.id = p_order_id;
$$;

revoke execute on function public.place_table_order(text, jsonb, text, text) from public;
grant execute on function public.place_table_order(text, jsonb, text, text) to anon, authenticated;
revoke execute on function public.get_table_by_token(text) from public;
grant execute on function public.get_table_by_token(text) to anon, authenticated;
revoke execute on function public.get_order_public(uuid) from public;
grant execute on function public.get_order_public(uuid) to anon, authenticated;

-- ---------- Realtime für den Küchenbildschirm ----------
alter publication supabase_realtime add table public.orders;
