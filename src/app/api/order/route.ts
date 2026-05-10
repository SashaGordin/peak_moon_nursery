import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// In-memory rate limiter: max 5 submissions per IP per 15 minutes.
// Note: resets per serverless instance — good enough to blunt casual abuse.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, buyer_name, buyer_email, buyer_phone, notes, items } =
    body as Record<string, unknown>;

  if (!token || typeof token !== "string" || token.length > 500) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (!buyer_name || typeof buyer_name !== "string" || buyer_name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!buyer_email || typeof buyer_email !== "string" || !EMAIL_RE.test(buyer_email.trim())) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const safeName = buyer_name.trim().slice(0, 200);
  const safeEmail = buyer_email.trim().slice(0, 254);
  const safePhone =
    buyer_phone && typeof buyer_phone === "string" ? buyer_phone.trim().slice(0, 30) : null;
  const safeNotes =
    notes && typeof notes === "string" ? notes.trim().slice(0, 2000) : null;

  if (!items || !Array.isArray(items) || items.length === 0 || items.length > 500) {
    return NextResponse.json({ error: "Select at least one plant" }, { status: 400 });
  }

  // Validate shape of each item — only trust id and requested_qty from the client
  for (const item of items as unknown[]) {
    if (!item || typeof item !== "object") {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
    }
    const { id, requested_qty } = item as Record<string, unknown>;
    if (!id || typeof id !== "string" || id.length > 200) {
      return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
    }
    if (
      typeof requested_qty !== "number" ||
      !Number.isInteger(requested_qty) ||
      requested_qty <= 0 ||
      requested_qty > 10000
    ) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
  }

  const requestedMap = new Map<string, number>(
    (items as Array<{ id: string; requested_qty: number }>).map((i) => [i.id, i.requested_qty])
  );

  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from("wholesale_tokens")
    .select("id, name")
    .eq("token", token)
    .eq("active", true)
    .single();

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: "Invalid or inactive link" }, { status: 403 });
  }

  // Re-fetch item details from DB — never trust client-supplied name/category/price
  const { data: dbItems } = await supabaseAdmin
    .from("stock_items")
    .select("id, name, category, price")
    .in("id", Array.from(requestedMap.keys()));

  if (!dbItems || dbItems.length === 0) {
    return NextResponse.json({ error: "Selected items are no longer available" }, { status: 400 });
  }

  const orderedItems = dbItems
    .filter((dbItem) => requestedMap.has(dbItem.id))
    .map((dbItem) => ({
      id: dbItem.id,
      name: dbItem.name as string,
      category: dbItem.category as string | null,
      price: dbItem.price as string | null,
      requested_qty: requestedMap.get(dbItem.id)!,
    }));

  if (orderedItems.length === 0) {
    return NextResponse.json({ error: "Selected items are no longer available" }, { status: 400 });
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("wholesale_orders")
    .insert({
      token_id: tokenRow.id,
      buyer_name: safeName,
      buyer_email: safeEmail,
      buyer_phone: safePhone,
      notes: safeNotes,
      items: orderedItems,
    })
    .select()
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  const itemLines = orderedItems
    .map(
      (i) =>
        `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(i.name)}${i.category ? ` <em style="color:#666">(${escapeHtml(i.category)})</em>` : ""}</td><td style="padding:4px 0">${i.requested_qty}</td><td style="padding:4px 0 4px 12px;color:#666">${escapeHtml(i.price ?? "")}</td></tr>`
    )
    .join("");

  const itemTable = `<table style="border-collapse:collapse;margin:12px 0"><thead><tr><th style="text-align:left;padding:4px 12px 4px 0;color:#666;font-weight:normal;font-size:13px">Plant</th><th style="text-align:left;padding:4px 0;color:#666;font-weight:normal;font-size:13px">Qty</th><th style="text-align:left;padding:4px 0 4px 12px;color:#666;font-weight:normal;font-size:13px">Price</th></tr></thead><tbody>${itemLines}</tbody></table>`;

  const adminEmail = process.env.ADMIN_EMAIL ?? "sasha@ergixlabs.com";

  await sendEmail({
    to: adminEmail,
    subject: `New wholesale order from ${safeName}`,
    html: `<h2 style="font-family:sans-serif">New wholesale order</h2><p style="font-family:sans-serif"><strong>${escapeHtml(safeName)}</strong> (${escapeHtml(safeEmail)}${safePhone ? `, ${escapeHtml(safePhone)}` : ""}) submitted a wholesale order.</p>${itemTable}${safeNotes ? `<p style="font-family:sans-serif"><strong>Notes:</strong> ${escapeHtml(safeNotes)}</p>` : ""}<p style="font-family:sans-serif;color:#666;font-size:13px">Order ID: ${order.id}</p>`,
  }).catch(console.error);

  await sendEmail({
    to: safeEmail,
    subject: "Your Peak Moon Nursery wholesale order",
    html: `<h2 style="font-family:sans-serif">Thanks, ${escapeHtml(safeName)}!</h2><p style="font-family:sans-serif">We received your wholesale order for the following starts:</p>${itemTable}${safeNotes ? `<p style="font-family:sans-serif"><strong>Your notes:</strong> ${escapeHtml(safeNotes)}</p>` : ""}<p style="font-family:sans-serif">We'll be in touch to confirm details and arrange pickup.</p><p style="font-family:sans-serif">— Peak Moon Nursery</p>`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, id: order.id });
}
