-- Beispieldaten (optional). Im Supabase SQL Editor ausführen.

insert into public.menu_categories (id, name, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '{"de":"Heißgetränke","tr":"Sıcak İçecekler","en":"Hot drinks"}', 1),
  ('00000000-0000-0000-0000-000000000002', '{"de":"Frühstück","tr":"Kahvaltı","en":"Breakfast"}', 2),
  ('00000000-0000-0000-0000-000000000003', '{"de":"Kuchen","tr":"Pastalar","en":"Cakes"}', 3);

insert into public.menu_items (category_id, name, description, price_cents, allergens, additives, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '{"de":"Espresso","tr":"Espresso","en":"Espresso"}', '{}', 250, '{}', '{11}', 1),
  ('00000000-0000-0000-0000-000000000001', '{"de":"Cappuccino","tr":"Cappuccino","en":"Cappuccino"}', '{"de":"Mit aufgeschäumter Milch","tr":"Köpüklü süt ile","en":"With foamed milk"}', 380, '{milk}', '{11}', 2),
  ('00000000-0000-0000-0000-000000000001', '{"de":"Türkischer Tee","tr":"Türk Çayı","en":"Turkish tea"}', '{}', 220, '{}', '{}', 3),
  ('00000000-0000-0000-0000-000000000002', '{"de":"Menemen","tr":"Menemen","en":"Menemen"}', '{"de":"Rührei mit Tomaten und Paprika, dazu Brot","tr":"Domatesli ve biberli yumurta, ekmek ile","en":"Scrambled eggs with tomatoes and peppers, served with bread"}', 890, '{eggs,gluten}', '{}', 1),
  ('00000000-0000-0000-0000-000000000003', '{"de":"Käsekuchen","tr":"Cheesecake","en":"Cheesecake"}', '{}', 450, '{milk,eggs,gluten}', '{}', 1);

insert into public.tables (label) values ('Tisch 1'), ('Tisch 2'), ('Tisch 3');

-- Personal anlegen: Zuerst unter Authentication → Users einen Nutzer erstellen,
-- dann diese Zeile mit der eigenen E-Mail-Adresse ausführen:
-- insert into public.staff (user_id, role) select id, 'admin' from auth.users where email = 'deine@email.de';
