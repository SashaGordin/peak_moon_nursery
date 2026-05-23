import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOwnerEmail } from "@/lib/owner-auth";
import type { TablesInsert } from "@/types/database";

const VALID_SECTIONS = ["in_stock", "wholesale"] as const;
type Section = (typeof VALID_SECTIONS)[number];

const SECTION_LABEL: Record<Section, string> = {
  in_stock: "in-stock",
  wholesale: "wholesale",
};

const ALLOWED_FIELDS: (keyof TablesInsert<"stock_items">)[] = [
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
];

export async function POST(req: Request) {
  const email = await getOwnerEmail();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rawSections = (body as { sections?: unknown }).sections;
  let sections: Section[];
  if (rawSections === undefined) {
    sections = ["in_stock"];
  } else if (
    Array.isArray(rawSections) &&
    rawSections.length > 0 &&
    rawSections.every((s) => VALID_SECTIONS.includes(s as Section))
  ) {
    sections = Array.from(new Set(rawSections as Section[]));
  } else {
    return NextResponse.json(
      { error: "Pick at least one section (in-stock or wholesale)." },
      { status: 400 }
    );
  }

  const base: TablesInsert<"stock_items"> = { name: "" };
  for (const key of ALLOWED_FIELDS) {
    if (key in (body as Record<string, unknown>)) {
      (base as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
    }
  }

  if (!base.name || typeof base.name !== "string" || base.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const created: unknown[] = [];
  const conflicts: Section[] = [];

  for (const section of sections) {
    const { data, error } = await supabaseAdmin
      .from("stock_items")
      .insert({ ...base, section })
      .select()
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        conflicts.push(section);
        continue;
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    created.push(data);
  }

  if (created.length > 0) {
    await supabaseAdmin
      .from("site_settings")
      .update({ stock_updated_at: new Date().toISOString() })
      .eq("id", 1);
  }

  if (created.length === 0 && conflicts.length > 0) {
    const label = conflicts.map((s) => SECTION_LABEL[s]).join(" and ");
    return NextResponse.json(
      {
        error: `A plant with this name already exists in the ${label} section.`,
        conflicts,
        created,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ created, conflicts });
}
