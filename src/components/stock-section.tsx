"use client";

import { useState, useMemo } from "react";
import type { StockItem } from "@/lib/seed-data";

const PAGE_SIZE = 24;

function StockBadge({ stock }: { stock?: number }) {
  if (stock == null) return null;
  if (stock <= 0) return <span className="card-stock-out">Sold out</span>;
  if (stock <= 5) return <span className="card-stock-low">Only {stock} left</span>;
  return <span>{stock} on the bench</span>;
}

function PlantCard({ item }: { item: StockItem }) {
  return (
    <article className="card">
      <span className="card-tag">{item.category ?? "Available"}</span>
      <h3>{item.name}</h3>
      {item.variety && <p className="card-variety">{item.variety}</p>}
      {item.description && <p className="card-notes">{item.description}</p>}
      {item.notes && <p className="card-notes" style={{ marginTop: item.description ? 4 : 0 }}>{item.notes}</p>}
      {(item.mature_height || item.days_to_maturity || item.growth_type) && (
        <p className="card-details">
          {[item.mature_height, item.days_to_maturity, item.growth_type].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="card-meta">
        {item.price && <span className="card-price">{item.price}</span>}
        <StockBadge stock={item.stock} />
      </div>
    </article>
  );
}

export default function StockSection({ items }: { items: StockItem[] }) {
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

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Filter by category">
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

      <div className="card-grid" aria-live="polite">
        {visible.length === 0 ? (
          <div className="empty">Nothing in this category right now.</div>
        ) : (
          visible.map((item) => <PlantCard key={item.id} item={item} />)
        )}
      </div>

      {hasMore && (
        <div className="load-more-wrap">
          <button className="btn btn-ghost" onClick={() => setPage((p) => p + 1)}>
            Show more ({filtered.length - visible.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
