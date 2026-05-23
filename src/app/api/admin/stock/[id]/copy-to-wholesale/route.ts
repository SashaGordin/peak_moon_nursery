import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";
import type { TablesInsert } from "@/types/database";

const COPYABLE_FIELDS: (keyof TablesInsert<"stock_items">)[] = [
  "name",
  "category",
  "variety",
  "description",
  "mature_height",
  "days_to_maturity",
  "growth_type",
  "price",
  "notes",
  "pot_size",
  "image_url",
];

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: source, error: srcErr } = await supabaseAdmin
    .from("stock_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (srcErr || !source) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (source.section === "wholesale") {
    return NextResponse.json(
      { error: "This item is already in the wholesale section." },
      { status: 409 }
    );
  }

  const insert: TablesInsert<"stock_items"> = { name: source.name, section: "wholesale" };
  for (const key of COPYABLE_FIELDS) {
    if (key === "name") continue;
    (insert as Record<string, unknown>)[key] = (source as Record<string, unknown>)[key];
  }

  const { data, error } = await supabaseAdmin
    .from("stock_items")
    .insert(insert)
    .select()
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "This item is already in the wholesale section." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("site_settings")
    .update({ stock_updated_at: new Date().toISOString() })
    .eq("id", 1);

  return NextResponse.json(data);
}
