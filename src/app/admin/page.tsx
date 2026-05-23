import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";
import AdminClient from "./AdminClient";
import type { StockItem, ComingSoonItem, EventItem, SignupItem, SiteSettings, WholesaleToken, WholesaleOrder } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ownerEmail = await getOwnerEmail();
  if (!ownerEmail) redirect("/");

  const [inStock, wholesaleStock, coming, events, settings, signups, tokens, orders] = await Promise.all([
    supabaseAdmin.from("stock_items").select("*").eq("section", "in_stock").order("created_at", { ascending: false }),
    supabaseAdmin.from("stock_items").select("*").eq("section", "wholesale").order("category").order("name"),
    supabaseAdmin.from("coming_soon_items").select("*").order("created_at"),
    supabaseAdmin.from("events").select("*").order("date"),
    supabaseAdmin.from("site_settings").select("*").single(),
    supabaseAdmin.from("signups").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("wholesale_tokens").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("wholesale_orders").select("*, wholesale_tokens(name)").order("created_at", { ascending: false }),
  ]);

  const s = settings.data;
  const mappedSettings: SiteSettings = {
    hours: s?.hours ?? "Saturdays & Sundays, 10am–4pm",
    contactEmail: s?.contact_email ?? "",
    contactPhone: s?.contact_phone ?? "",
    stockUpdatedAt: s?.stock_updated_at ?? null,
  };

  const mappedSignups: SignupItem[] = (signups.data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    email: r.email,
    interests: r.interests ?? undefined,
    createdAt: r.created_at ?? undefined,
  }));

  return (
    <AdminClient
      initialStock={(inStock.data ?? []) as StockItem[]}
      initialWholesaleStock={(wholesaleStock.data ?? []) as StockItem[]}
      initialComingSoon={(coming.data ?? []) as ComingSoonItem[]}
      initialEvents={(events.data ?? []) as EventItem[]}
      initialSettings={mappedSettings}
      initialSignups={mappedSignups}
      initialWholesaleTokens={(tokens.data ?? []) as WholesaleToken[]}
      initialWholesaleOrders={(orders.data ?? []) as WholesaleOrder[]}
    />
  );
}
