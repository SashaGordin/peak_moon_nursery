import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function POST(req: Request) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { hours, contactEmail, contactPhone } = await req.json();
  const { error } = await supabaseAdmin
    .from("site_settings")
    .update({ hours, contact_email: contactEmail, contact_phone: contactPhone })
    .eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
