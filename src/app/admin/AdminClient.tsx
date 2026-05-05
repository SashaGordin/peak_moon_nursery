"use client";

import { useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  type StockItem,
  type ComingSoonItem,
  type EventItem,
  type SignupItem,
  type SiteSettings,
} from "@/lib/seed-data";

type TabId = "stock" | "coming" | "events" | "settings" | "signups";

type Store = {
  in_stock: StockItem[];
  coming_soon: ComingSoonItem[];
  events: EventItem[];
  signups: SignupItem[];
  settings: SiteSettings;
};

type Props = {
  initialStock: StockItem[];
  initialComingSoon: ComingSoonItem[];
  initialEvents: EventItem[];
  initialSettings: SiteSettings;
  initialSignups: SignupItem[];
};

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
    <div className={`toast show${kind === "error" ? " error" : ""}`} role="status">
      {text}
    </div>
  );
}

export default function AdminClient({
  initialStock,
  initialComingSoon,
  initialEvents,
  initialSettings,
  initialSignups,
}: Props) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<TabId>("stock");
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [store, setStore] = useState<Store>({
    in_stock: initialStock,
    coming_soon: initialComingSoon,
    events: [...initialEvents].sort((a, b) => a.date.localeCompare(b.date)),
    signups: initialSignups,
    settings: initialSettings,
  });

  function showToast(text: string, kind: "ok" | "error" = "ok") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  async function apiPost(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Request failed");
    }
    return res.json();
  }

  async function apiDelete(path: string) {
    const res = await fetch(path, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Request failed");
    }
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
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const form = e.currentTarget;
                const body = {
                  name: fd.get("name") as string,
                  variety: (fd.get("variety") as string) || null,
                  category: (fd.get("category") as string) || null,
                  price: (fd.get("price") as string) || null,
                  stock: fd.get("stock") ? Number(fd.get("stock")) : null,
                  notes: (fd.get("notes") as string) || null,
                };
                try {
                  const saved = await apiPost("/api/admin/stock", body);
                  setStore((prev) => ({ ...prev, in_stock: [saved, ...prev.in_stock] }));
                  showToast("Saved.");
                  form.reset();
                } catch (err) {
                  showToast((err as Error).message, "error");
                }
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
                    onDelete={async () => {
                      try {
                        await apiDelete(`/api/admin/stock/${item.id}`);
                        setStore((prev) => ({ ...prev, in_stock: prev.in_stock.filter((i) => i.id !== item.id) }));
                        showToast("Removed.");
                      } catch (err) {
                        showToast((err as Error).message, "error");
                      }
                    }}
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
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const form = e.currentTarget;
                const body = {
                  name: fd.get("name") as string,
                  variety: (fd.get("variety") as string) || null,
                  eta: (fd.get("eta") as string) || null,
                  notes: (fd.get("notes") as string) || null,
                };
                try {
                  const saved = await apiPost("/api/admin/coming-soon", body);
                  setStore((prev) => ({ ...prev, coming_soon: [...prev.coming_soon, saved] }));
                  showToast("Saved.");
                  form.reset();
                } catch (err) {
                  showToast((err as Error).message, "error");
                }
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
                    onDelete={async () => {
                      try {
                        await apiDelete(`/api/admin/coming-soon/${item.id}`);
                        setStore((prev) => ({ ...prev, coming_soon: prev.coming_soon.filter((i) => i.id !== item.id) }));
                        showToast("Removed.");
                      } catch (err) {
                        showToast((err as Error).message, "error");
                      }
                    }}
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
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const form = e.currentTarget;
                const body = {
                  title: fd.get("title") as string,
                  date: fd.get("date") as string,
                  description: (fd.get("description") as string) || null,
                };
                try {
                  const saved = await apiPost("/api/admin/events", body);
                  setStore((prev) => ({
                    ...prev,
                    events: [...prev.events, saved].sort((a, b) => a.date.localeCompare(b.date)),
                  }));
                  showToast("Saved.");
                  form.reset();
                } catch (err) {
                  showToast((err as Error).message, "error");
                }
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
                    onDelete={async () => {
                      try {
                        await apiDelete(`/api/admin/events/${ev.id}`);
                        setStore((prev) => ({ ...prev, events: prev.events.filter((i) => i.id !== ev.id) }));
                        showToast("Removed.");
                      } catch (err) {
                        showToast((err as Error).message, "error");
                      }
                    }}
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
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const body = {
                  hours: (fd.get("hours") as string) || store.settings.hours,
                  contactPhone: (fd.get("contactPhone") as string) ?? "",
                  contactEmail: (fd.get("contactEmail") as string) ?? "",
                };
                try {
                  await apiPost("/api/admin/settings", body);
                  setStore((prev) => ({ ...prev, settings: { ...prev.settings, ...body } }));
                  showToast("Settings saved.");
                } catch (err) {
                  showToast((err as Error).message, "error");
                }
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
                    onDelete={async () => {
                      try {
                        await apiDelete(`/api/admin/signups/${s.id}`);
                        setStore((prev) => ({ ...prev, signups: prev.signups.filter((i) => i.id !== s.id) }));
                        showToast("Removed.");
                      } catch (err) {
                        showToast((err as Error).message, "error");
                      }
                    }}
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
