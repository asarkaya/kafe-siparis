import type { Locale } from "@/i18n/config";

export type LocalizedText = Partial<Record<Locale, string>> & { de?: string };

export type MenuCategory = {
  id: string;
  name: LocalizedText;
  sort_order: number;
  active: boolean;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: LocalizedText;
  description: LocalizedText;
  price_cents: number;
  allergens: string[];
  additives: string[];
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type CafeTable = {
  id: string;
  label: string;
  qr_token: string;
  active: boolean;
};

export type OrderStatus = "new" | "preparing" | "ready" | "served" | "cancelled";
export type OrderType = "table" | "remote";
export type PaymentStatus = "pay_at_counter" | "pending" | "paid" | "failed" | "refunded";

export type OrderItem = {
  id: string;
  name_snapshot: LocalizedText;
  unit_price_cents: number;
  quantity: number;
  note: string | null;
};

export type Order = {
  id: string;
  order_number: number;
  type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_name: string | null;
  note: string | null;
  total_cents: number;
  created_at: string;
  tables: { label: string } | null;
  order_items: OrderItem[];
};
