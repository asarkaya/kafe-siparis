# kafe-siparis

Almanya'daki kafe ve restoranlar için sipariş uygulaması (MVP).

- Müşteri masadaki **QR kodu** okutur, menüden seçer, sipariş verir.
- Sipariş anında **mutfak ekranına** düşer (Supabase Realtime).
- Masa siparişlerinde ödeme kasada yapılır (mevcut kasa sistemi). Uygulama yazar kasa değildir.
- Online (evden) sipariş ve online ödeme (Stripe/Mollie) sonraki adım. Veritabanı buna şimdiden hazır:
  `type = 'remote'` siparişler ancak `payment_status = 'paid'` olunca mutfakta görünür.
- Arayüz dili **Almanca** (varsayılan); **Türkçe** ve **İngilizce** seçilebilir.
- Menüde her ürün için 3 dilde ad/açıklama, **alerjenler** (AB 14) ve **katkı maddeleri** (Zusatzstoffe).
- Impressum ve Datenschutz sayfaları (şablon, doldurulması gerekiyor).

## Sayfalar

| Adres | Ne işe yarar |
| --- | --- |
| `/` | Giriş sayfası |
| `/menu` | Menüyü sadece görüntüleme |
| `/t/<token>` | Masadan sipariş (QR kod bu adresi açar) |
| `/order/<id>` | Müşterinin sipariş durumu |
| `/kitchen` | Mutfak ekranı (personel girişi gerekli) |
| `/admin` | Menü ve masa/QR yönetimi (admin girişi gerekli) |
| `/impressum`, `/datenschutz` | Yasal sayfalar |

## Kurulum (adım adım)

1. **Veritabanı:** Supabase → projeniz → *SQL Editor* → `supabase/migrations/20261025000000_init.sql`
   dosyasının içeriğini yapıştırıp *Run*. İsterseniz ardından `supabase/seed.sql` ile örnek menü ve 3 masa ekleyin.
2. **Personel hesabı:** Supabase → *Authentication* → *Users* → *Add user* (e-posta + şifre).
   Sonra SQL Editor'da:
   ```sql
   insert into public.staff (user_id, role)
   select id, 'admin' from auth.users where email = 'sizin@email.de';
   ```
   (`role` = `admin` her şeyi yapabilir, `kitchen` sadece mutfak ekranını görür.)
3. **Anahtarlar:** Supabase → *Project Settings* → *API*. Buradaki *Project URL* ve *anon public* anahtarı
   `.env.example` dosyasını `.env.local` olarak kopyalayıp içine yazın. (`service_role` anahtarını asla buraya yazmayın.)
4. **Çalıştırma:**
   ```bash
   npm install
   npm run dev
   ```
   Tarayıcıda http://localhost:3000 açılır.

## Teknik

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Realtime) — bölge: Frankfurt (eu-central-1)
- Güvenlik: Tüm tablolarda Row Level Security. Misafirler tabloya doğrudan yazamaz; sipariş sadece
  `place_table_order` fonksiyonu ile verilir ve fiyatlar sunucuda menüden hesaplanır.
- Çeviriler: `src/i18n/dictionaries.ts`
