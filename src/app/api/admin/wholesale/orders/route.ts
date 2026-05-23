import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function GET() {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("wholesale_orders")
    .select("*, wholesale_tokens(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
