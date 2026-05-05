"use client";

import { useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  seedData,
  type StockItem,
  type ComingSoonItem,
  type EventItem,
  type SignupItem,
  type SiteSettings,
} from "@/lib/seed-data";

// TODO: replace in-memory store operations with Supabase calls

type TabId = "stock" | "coming" | "events" | "settings" | "signups";

type Store = {
  in_stock: StockItem[];
  coming_soon: ComingSoonItem[];
  events: EventItem[];
  signups: SignupItem[];
  settings: SiteSettings;
};

function uid() {
  return "local_" + Math.random().toString(36).slice(2, 9);
}

function AdminRow({
  primary,
  secondary,
  tertiary,
  badge,
  onDelete,
}: {
  primary: string;
  secondary?: string;
  tertiary?: string;
  badge?: string;
  onDelete: () => void;
}) {
  return (
    <div className="admin-row">
      <div className="row-name">
        {primary}
        {secondary && <em>{secondary}</em>}
      </div>
      <div>{tertiary ?? ""}</div>
      <div className="muted">{badge ?? ""}</div>
      <div />
      <div className="row-actions">
        <button
          className="icon-btn danger"
          onClick={() => {
            if (confirm(`Remove "${primary}"?`)) onDelete();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function Toast({ text, kind }: { text: string; kind: "ok" | "error" }) {
  return (
    <div
      className={`toast show${kind === "error" ? " error" : ""}`}
      role="status"
    >
      {text}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<TabId>("stock");
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [store, setStore] = useState<Store>(() => ({
    in_stock: [...seedData.in_stock],
    coming_soon: [...seedData.coming_soon],
    events: [...seedData.events].sort((a, b) => a.date.localeCompare(b.date)),
    signups: [],
    settings: { ...seedData.settings },
  }));

  function showToast(text: string, kind: "ok" | "error" = "ok") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function removeFrom(key: "in_stock" | "coming_soon" | "events" | "signups", id: string) {
    setStore((prev) => ({ ...prev, [key]: (prev[key] as { id: string }[]).filter((d) => d.id !== id) }));
  }

  function exportCsv() {
    const items = store.signups;
    if (!items.length) { showToast("No signups to export."); return; }
    const headers = ["name", "email", "interests", "createdAt"];
    const lines = [headers.join(",")];
    for (const it of items) {
      const row = [it.name, it.email, it.interests ?? "", it.createdAt ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
      lines.push(row);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peak-moon-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "stock", label: "In stock" },
    { id: "coming", label: "Coming soon" },
    { id: "events", label: "Events" },
    { id: "settings", label: "Site settings" },
    { id: "signups", label: "Newsletter" },
  ];

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <div>
          <h1>Owner portal</h1>
          <p className="muted" style={{ margin: 0 }}>
            Update the bench, post events, manage your list.
          </p>
        </div>
        <div className="who">
          Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "(owner)"}
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 14px", fontSize: "13px" }}
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* STOCK TAB */}
      {activeTab === "stock" && (
        <section>
          <div className="admin-card">
            <h2>Add a plant to the bench</h2>
            <p className="hint">Anything saved here shows up on the public site.</p>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const item: StockItem = {
                  id: uid(),
                  name: fd.get("name") as string,
                  variety: (fd.get("variety") as string) || undefined,
                  category: (fd.get("category") as string) || undefined,
                  price: (fd.get("price") as string) || undefined,
                  stock: fd.get("stock") ? Number(fd.get("stock")) : undefined,
                  notes: (fd.get("notes") as string) || undefined,
                };
                setStore((prev) => ({ ...prev, in_stock: [...prev.in_stock, item] }));
                showToast("Saved.");
                e.currentTarget.reset();
              }}
            >
              <label>
                <span className="lbl">Name</span>
                <input name="name" placeholder="Cherokee Purple Tomato" required />
              </label>
              <label>
                <span className="lbl">Variety / type</span>
                <input name="variety" placeholder="Heirloom · indeterminate" />
              </label>
              <label>
                <span className="lbl">Category</span>
                <select name="category">
                  <option value="">— pick one —</option>
                  {["Tomato","Pepper","Squash","Greens","Herb","Flower","Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="lbl">Price</span>
                <input name="price" placeholder="$5" />
              </label>
              <label>
                <span className="lbl">Quantity on bench</span>
                <input name="stock" type="number" min="0" placeholder="12" />
              </label>
              <label className="field-full">
                <span className="lbl">
                  Notes <span style={{ fontWeight: 400 }}>(one short sentence)</span>
                </span>
                <input name="notes" placeholder="Smoky, sweet, big slicer." />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="reset" className="btn btn-secondary">Clear</button>
              </div>
            </form>
          </div>
          <div className="admin-card">
            <h2>On the bench right now</h2>
            <div className="admin-list">
              {store.in_stock.length === 0 ? (
                <div className="empty">Nothing here yet.</div>
              ) : (
                store.in_stock.map((item) => (
                  <AdminRow
                    key={item.id}
                    primary={item.name}
                    secondary={item.variety}
                    tertiary={item.notes}
                    badge={[item.category, item.price, item.stock != null ? `${item.stock} on bench` : ""].filter(Boolean).join(" · ")}
                    onDelete={() => { removeFrom("in_stock", item.id); showToast("Removed."); }}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* COMING SOON TAB */}
      {activeTab === "coming" && (
        <section>
          <div className="admin-card">
            <h2>Add something coming up</h2>
            <p className="hint">Like &ldquo;peppers next week&rdquo; — give customers a heads-up.</p>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const item: ComingSoonItem = {
                  id: uid(),
                  name: fd.get("name") as string,
                  variety: (fd.get("variety") as string) || undefined,
                  eta: (fd.get("eta") as string) || undefined,
                  notes: (fd.get("notes") as string) || undefined,
                };
                setStore((prev) => ({ ...prev, coming_soon: [...prev.coming_soon, item] }));
                showToast("Saved.");
                e.currentTarget.reset();
              }}
            >
              <label>
                <span className="lbl">Name</span>
                <input name="name" placeholder="Sweet Peppers" required />
              </label>
              <label>
                <span className="lbl">Variety / type</span>
                <input name="variety" placeholder="Several varieties" />
              </label>
              <label>
                <span className="lbl">ETA</span>
                <input name="eta" placeholder="Next week" />
              </label>
              <label className="field-full">
                <span className="lbl">Notes</span>
                <input name="notes" placeholder="Hardening off now — bench-ready next week." />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="reset" className="btn btn-secondary">Clear</button>
              </div>
            </form>
          </div>
          <div className="admin-card">
            <h2>What&apos;s coming up</h2>
            <div className="admin-list">
              {store.coming_soon.length === 0 ? (
                <div className="empty">Nothing here yet.</div>
              ) : (
                store.coming_soon.map((item) => (
                  <AdminRow
                    key={item.id}
                    primary={item.name}
                    secondary={item.variety}
                    tertiary={item.notes}
                    badge={item.eta}
                    onDelete={() => { removeFrom("coming_soon", item.id); showToast("Removed."); }}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* EVENTS TAB */}
      {activeTab === "events" && (
        <section>
          <div className="admin-card">
            <h2>Post an event</h2>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const item: EventItem = {
                  id: uid(),
                  title: fd.get("title") as string,
                  date: fd.get("date") as string,
                  description: (fd.get("description") as string) || undefined,
                };
                setStore((prev) => ({
                  ...prev,
                  events: [...prev.events, item].sort((a, b) => a.date.localeCompare(b.date)),
                }));
                showToast("Saved.");
                e.currentTarget.reset();
              }}
            >
              <label>
                <span className="lbl">Title</span>
                <input name="title" placeholder="Open weekend" required />
              </label>
              <label>
                <span className="lbl">Date</span>
                <input name="date" type="date" required />
              </label>
              <label className="field-full">
                <span className="lbl">Description</span>
                <input name="description" placeholder="Stop by the bench — first big restock of the year." />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="reset" className="btn btn-secondary">Clear</button>
              </div>
            </form>
          </div>
          <div className="admin-card">
            <h2>Upcoming events</h2>
            <div className="admin-list">
              {store.events.length === 0 ? (
                <div className="empty">Nothing here yet.</div>
              ) : (
                store.events.map((ev) => (
                  <AdminRow
                    key={ev.id}
                    primary={ev.title}
                    secondary={ev.description}
                    tertiary={ev.date}
                    onDelete={() => { removeFrom("events", ev.id); showToast("Removed."); }}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <section>
          <div className="admin-card">
            <h2>Site settings</h2>
            <p className="hint">These show up in the &ldquo;Visit&rdquo; section on the home page.</p>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setStore((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    hours: (fd.get("hours") as string) || prev.settings.hours,
                    contactPhone: (fd.get("contactPhone") as string) ?? "",
                    contactEmail: (fd.get("contactEmail") as string) ?? "",
                  },
                }));
                showToast("Settings saved.");
              }}
            >
              <label className="field-full">
                <span className="lbl">Hours</span>
                <input
                  name="hours"
                  placeholder="Saturdays & Sundays, 10am–4pm"
                  defaultValue={store.settings.hours}
                />
              </label>
              <label>
                <span className="lbl">Contact phone</span>
                <input
                  name="contactPhone"
                  placeholder="(206) ..."
                  defaultValue={store.settings.contactPhone}
                />
              </label>
              <label>
                <span className="lbl">Contact email</span>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="hello@peakmoon.farm"
                  defaultValue={store.settings.contactEmail}
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Save settings</button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* SIGNUPS TAB */}
      {activeTab === "signups" && (
        <section>
          <div className="admin-card">
            <h2>Newsletter signups</h2>
            <p className="hint">
              Folks who asked to be emailed when something new hits the bench. Click &ldquo;Export CSV&rdquo; to
              send blasts from your own email tool.
            </p>
            <div className="form-actions" style={{ marginBottom: 14 }}>
              <button className="btn btn-secondary" onClick={exportCsv}>
                Export CSV
              </button>
            </div>
            <div className="admin-list">
              {store.signups.length === 0 ? (
                <div className="empty">No signups yet.</div>
              ) : (
                store.signups.map((s) => (
                  <AdminRow
                    key={s.id}
                    primary={s.name || "(no name)"}
                    secondary={s.email}
                    tertiary={s.interests}
                    badge={s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                    onDelete={() => { removeFrom("signups", s.id); showToast("Removed."); }}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {toast && <Toast text={toast.text} kind={toast.kind} />}
    </div>
  );
}
