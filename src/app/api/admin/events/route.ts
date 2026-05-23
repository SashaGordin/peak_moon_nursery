import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function POST(req: Request) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("events")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
