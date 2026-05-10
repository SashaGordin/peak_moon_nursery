import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

type OrderItem = {
  id: string;
  name: string;
  category?: string;
  price?: string;
  requested_qty: number;
};

export async function POST(req: Request) {
  const body = await req.json();
  const { token, buyer_name, buyer_email, buyer_phone, notes, items } = body;

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!buyer_name || !buyer_email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  if (!items || !Array.isArray(items) || items.filter((i: OrderItem) => i.requested_qty > 0).length === 0) {
    return NextResponse.json({ error: "Select at least one plant" }, { status: 400 });
  }

  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from("wholesale_tokens")
    .select("id, name")
    .eq("token", token)
    .eq("active", true)
    .single();

  if (tokenErr || !tokenRow) return NextResponse.json({ error: "Invalid or inactive link" }, { status: 403 });

  const orderedItems: OrderItem[] = items.filter((i: OrderItem) => i.requested_qty > 0);

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("wholesale_orders")
    .insert({
      token_id: tokenRow.id,
      buyer_name,
      buyer_email,
      buyer_phone: buyer_phone || null,
      notes: notes || null,
      items: orderedItems,
    })
    .select()
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  const itemLines = orderedItems
    .map((i) => `<tr><td style="padding:4px 12px 4px 0">${i.name}${i.category ? ` <em style="color:#666">(${i.category})</em>` : ""}</td><td style="padding:4px 0">${i.requested_qty}</td><td style="padding:4px 0 4px 12px;color:#666">${i.price ?? ""}</td></tr>`)
    .join("");

  const itemTable = `<table style="border-collapse:collapse;margin:12px 0"><thead><tr><th style="text-align:left;padding:4px 12px 4px 0;color:#666;font-weight:normal;font-size:13px">Plant</th><th style="text-align:left;padding:4px 0;color:#666;font-weight:normal;font-size:13px">Qty</th><th style="text-align:left;padding:4px 0 4px 12px;color:#666;font-weight:normal;font-size:13px">Price</th></tr></thead><tbody>${itemLines}</tbody></table>`;

  const adminEmail = process.env.ADMIN_EMAIL ?? "sasha@ergixlabs.com";

  await sendEmail({
    to: adminEmail,
    subject: `New wholesale order from ${buyer_name}`,
    html: `<h2 style="font-family:sans-serif">New wholesale order</h2><p style="font-family:sans-serif"><strong>${buyer_name}</strong> (${buyer_email}${buyer_phone ? `, ${buyer_phone}` : ""}) submitted a wholesale order.</p>${itemTable}${notes ? `<p style="font-family:sans-serif"><strong>Notes:</strong> ${notes}</p>` : ""}<p style="font-family:sans-serif;color:#666;font-size:13px">Order ID: ${order.id}</p>`,
  }).catch(console.error);

  await sendEmail({
    to: buyer_email,
    subject: "Your Peak Moon Nursery wholesale order",
    html: `<h2 style="font-family:sans-serif">Thanks, ${buyer_name}!</h2><p style="font-family:sans-serif">We received your wholesale order for the following starts:</p>${itemTable}${notes ? `<p style="font-family:sans-serif"><strong>Your notes:</strong> ${notes}</p>` : ""}<p style="font-family:sans-serif">We'll be in touch to confirm details and arrange pickup.</p><p style="font-family:sans-serif">— Peak Moon Nursery</p>`,
  }).catch(console.error);

  return NextResponse.json({ ok: true, id: order.id });
}
