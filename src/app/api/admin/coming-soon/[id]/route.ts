import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin.from("coming_soon_items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
