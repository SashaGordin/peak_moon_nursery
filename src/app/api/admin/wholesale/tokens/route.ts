import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";

export async function POST(req: Request) {
  const owner = await getOwnerEmail();
  if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, notes } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("wholesale_tokens")
    .insert({ name, email: email || null, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("wholesale_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
