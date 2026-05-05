import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { TablesUpdate } from "@/types/database";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed: (keyof TablesUpdate<"stock_items">)[] = [
    "price", "stock", "notes", "name", "category", "variety",
    "description", "mature_height", "days_to_maturity", "growth_type",
  ];
  const update: TablesUpdate<"stock_items"> = {};
  for (const key of allowed) {
    if (key in body) (update as Record<string, unknown>)[key] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from("stock_items")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("site_settings")
    .update({ stock_updated_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin.from("stock_items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("site_settings")
    .update({ stock_updated_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json({ ok: true });
}
