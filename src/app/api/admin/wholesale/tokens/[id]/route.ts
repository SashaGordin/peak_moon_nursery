import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/types/database";

type TokenUpdate = Database["public"]["Tables"]["wholesale_tokens"]["Update"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: TokenUpdate = {};
  if ("name" in body) patch.name = body.name;
  if ("email" in body) patch.email = body.email ?? null;
  if ("notes" in body) patch.notes = body.notes ?? null;
  if ("active" in body) patch.active = body.active;

  const { data, error } = await supabaseAdmin
    .from("wholesale_tokens")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("wholesale_tokens")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
