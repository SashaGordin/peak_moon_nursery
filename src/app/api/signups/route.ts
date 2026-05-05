import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const { name, email, interests } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("signups").insert({ name, email, interests });

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Already on the list" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
