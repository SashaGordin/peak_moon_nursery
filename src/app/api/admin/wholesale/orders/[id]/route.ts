import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  const valid = ["pending", "confirmed", "fulfilled", "cancelled"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("wholesale_orders")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
