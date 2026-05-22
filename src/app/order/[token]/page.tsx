import { supabaseAdmin } from "@/lib/supabase";
import WholesaleOrderClient from "./WholesaleOrderClient";

export const dynamic = "force-dynamic";

export default async function WholesaleOrderPage({ params }: { params: { token: string } }) {
  const { data: tokenRow } = await supabaseAdmin
    .from("wholesale_tokens")
    .select("id, name, email")
    .eq("token", params.token)
    .eq("active", true)
    .single();

  if (!tokenRow) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Link not found</h1>
          <p style={{ color: "#666" }}>This wholesale link is not valid or has been deactivated.</p>
        </div>
      </main>
    );
  }

  const { data: stockItems } = await supabaseAdmin
    .from("stock_items")
    .select("*")
    .order("category")
    .order("name");

  return (
    <WholesaleOrderClient
      token={params.token}
      accountName={tokenRow.name}
      accountEmail={tokenRow.email ?? ""}
      items={(stockItems ?? []) as import("@/lib/seed-data").StockItem[]}
    />
  );
}
