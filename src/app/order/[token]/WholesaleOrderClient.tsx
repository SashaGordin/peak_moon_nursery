"use client";

import { useState, useMemo } from "react";
import type { StockItem } from "@/lib/seed-data";

const PAGE_SIZE = 24;

type Props = {
  token: string;
  accountName: string;
  accountEmail: string;
  items: StockItem[];
};

type Quantities = Record<string, number>;

function PlantOrderCard({
  item,
  qty,
  onChange,
}: {
  item: StockItem;
  qty: number;
  onChange: (id: string, qty: number) => void;
}) {
  return (
    <article className="card" style={{ position: "relative" }}>
      {item.image_url && (
        <div className="card-image">
          <img src={item.image_url} alt={item.name} loading="lazy" />
        </div>
      )}
      <span className="card-tag">{item.category ?? "Available"}</span>
      <h3>{item.name}</h3>
      {item.variety && <p className="card-variety">{item.variety}</p>}
      {item.description && <p className="card-notes">{item.description}</p>}
      {item.notes && (
        <p className="card-notes" style={{ marginTop: item.description ? 4 : 0 }}>
          {item.notes}
        </p>
      )}
      {(item.mature_height || item.days_to_maturity || item.growth_type) && (
        <p className="card-details">
          {[item.mature_height, item.days_to_maturity, item.growth_type].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="card-meta" style={{ marginBottom: "0.75rem" }}>
        {item.price && <span className="card-price">{item.price}</span>}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "13px", color: "#555", minWidth: "60px" }}>Qty:</span>
        <input
          type="number"
          min={0}
          value={qty}
          onChange={(e) => onChange(item.id, Math.max(0, parseInt(e.target.value) || 0))}
          style={{
            width: "72px",
            padding: "4px 8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            background: qty > 0 ? "#f0f9f0" : undefined,
          }}
        />
        {qty > 0 && (
          <span style={{ color: "#4a7c59", fontSize: "12px", fontWeight: 500 }}>✓ added</span>
        )}
      </label>
    </article>
  );
}

export default function WholesaleOrderClient({ token, accountName, accountEmail, items }: Props) {
  const [quantities, setQuantities] = useState<Quantities>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [buyerName, setBuyerName] = useState(accountName);
  const [buyerEmail, setBuyerEmail] = useState(accountEmail);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const item of items) {
      if (item.category && !seen.has(item.category)) {
        seen.add(item.category);
        cats.push(item.category);
      }
    }
    return cats.sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  function selectCategory(cat: string | null) {
    setActiveCategory(cat);
    setPage(1);
  }

  const selectedItems = useMemo(
    () => items.filter((i) => (quantities[i.id] ?? 0) > 0),
    [items, quantities]
  );
  const totalQty = selectedItems.reduce((sum, i) => sum + (quantities[i.id] ?? 0), 0);

  function updateQty(id: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedItems.length === 0) { setError("Select at least one plant."); return; }
    setError("");
    setSubmitting(true);

    const payload = {
      token,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone || undefined,
      notes: orderNotes || undefined,
      items: selectedItems.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: i.price,
        requested_qty: quantities[i.id],
      })),
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", textAlign: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "480px" }}>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>✓</p>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Order received</h1>
          <p style={{ color: "#555", lineHeight: 1.6 }}>
            Thanks, {buyerName}! We got your order for {totalQty} {totalQty === 1 ? "start" : "starts"} across {selectedItems.length} {selectedItems.length === 1 ? "variety" : "varieties"}. We&apos;ll be in touch at {buyerEmail} to confirm details and arrange pickup.
          </p>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "1.5rem" }}>— Peak Moon Nursery</p>
        </div>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7" }}>
      <header style={{ borderBottom: "1px solid #e5e0d8", background: "#fff", padding: "1.25rem 2rem", display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", margin: 0 }}>Peak Moon Nursery</h1>
          <p style={{ margin: "2px 0 0", color: "#666", fontSize: "14px" }}>Wholesale order form — {accountName}</p>
        </div>
        {totalQty > 0 && (
          <div style={{ marginLeft: "auto", background: "#4a7c59", color: "#fff", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: 500 }}>
            {totalQty} {totalQty === 1 ? "start" : "starts"} selected
          </div>
        )}
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <p style={{ color: "#555", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Browse available starts below and enter the quantity you&apos;d like for each. Submit when ready — we&apos;ll confirm your order by email.
        </p>

        {/* Category filter */}
        <div className="filter-bar" role="group" aria-label="Filter by category" style={{ marginBottom: "1.5rem" }}>
          <button
            className={`filter-btn${activeCategory === null ? " active" : ""}`}
            onClick={() => selectCategory(null)}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                className={`filter-btn${activeCategory === cat ? " active" : ""}`}
                onClick={() => selectCategory(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Plant grid */}
        <div className="card-grid" aria-live="polite" style={!hasMore ? { marginBottom: "3rem" } : undefined}>
          {visible.length === 0 ? (
            <div className="empty">Nothing in this category right now.</div>
          ) : (
            visible.map((item) => (
              <PlantOrderCard
                key={item.id}
                item={item}
                qty={quantities[item.id] ?? 0}
                onChange={updateQty}
              />
            ))
          )}
        </div>

        {hasMore && (
          <div className="load-more-wrap" style={{ marginBottom: "3rem" }}>
            <button className="btn btn-ghost" onClick={() => setPage((p) => p + 1)}>
              Show more ({filtered.length - visible.length} remaining)
            </button>
          </div>
        )}

        {/* Order summary + contact form */}
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {selectedItems.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: "8px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", marginTop: 0, marginBottom: "0.75rem" }}>Your selections</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {selectedItems.map((i) => (
                  <li key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "14px", borderBottom: "1px solid #f0ece6" }}>
                    <span>{i.name}{i.category ? <em style={{ color: "#888", marginLeft: "0.4em" }}>({i.category})</em> : null}</span>
                    <span style={{ fontWeight: 500 }}>× {quantities[i.id]}</span>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "13px", color: "#666" }}>
                {selectedItems.length} {selectedItems.length === 1 ? "variety" : "varieties"} · {totalQty} total {totalQty === 1 ? "start" : "starts"}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", marginTop: 0, marginBottom: "1rem" }}>Your contact info</h3>

            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "13px", color: "#555", display: "block", marginBottom: "4px" }}>Name / Business *</span>
              <input
                required
                maxLength={200}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "13px", color: "#555", display: "block", marginBottom: "4px" }}>Email *</span>
              <input
                required
                type="email"
                maxLength={254}
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "13px", color: "#555", display: "block", marginBottom: "4px" }}>Phone (optional)</span>
              <input
                type="tel"
                maxLength={30}
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ fontSize: "13px", color: "#555", display: "block", marginBottom: "4px" }}>Notes or Special Orders (optional)</span>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Notes or special order requests — e.g. a variety not listed above, preferred pickup time, substitutions, etc."
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
              />
            </label>

            {error && <p style={{ color: "#c0392b", fontSize: "14px", marginBottom: "1rem" }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="btn"
              style={{ width: "100%", opacity: submitting || selectedItems.length === 0 ? 0.6 : 1, cursor: submitting || selectedItems.length === 0 ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Submitting…" : selectedItems.length === 0 ? "Select plants above to continue" : `Submit order (${totalQty} ${totalQty === 1 ? "start" : "starts"})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
