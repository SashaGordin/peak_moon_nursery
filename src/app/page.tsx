import type { Metadata } from "next";
import NewsletterForm from "@/components/newsletter-form";
import StockSection from "@/components/stock-section";
import { supabaseAdmin } from "@/lib/supabase";
import type { StockItem, ComingSoonItem, EventItem } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Peak Moon Nursery — Vashon Island",
  description:
    "Peak Moon Nursery — small-batch, NW-grown vegetable starts, herbs, and flowers on Vashon Island. Run by Selena and Keaton.",
};

function ComingSoonCard({ item }: { item: ComingSoonItem }) {
  return (
    <article className="card">
      <span className="card-tag">Coming up</span>
      <h3>{item.name}</h3>
      {item.variety && <p className="card-variety">{item.variety}</p>}
      {item.notes && <p className="card-notes">{item.notes}</p>}
      <div className="card-meta">
        <span>{item.eta ? `ETA: ${item.eta}` : "Soon"}</span>
      </div>
    </article>
  );
}

function EventRow({ event }: { event: EventItem }) {
  const d = event.date ? new Date(event.date + "T12:00:00") : null;
  const month = d ? d.toLocaleString("en-US", { month: "short" }) : "—";
  const day = d ? String(d.getDate()) : "?";
  const year = d ? String(d.getFullYear()) : "";
  return (
    <article className="event">
      <div className="event-date">
        <div className="month">{month}</div>
        <div className="day">{day}</div>
        <div className="year">{year}</div>
      </div>
      <div>
        <h3>{event.title}</h3>
        {event.description && <p>{event.description}</p>}
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [stockResult, comingResult, eventsResult, settingsResult] = await Promise.all([
    supabaseAdmin.from("stock_items").select("*").eq("section", "in_stock").order("created_at", { ascending: false }),
    supabaseAdmin.from("coming_soon_items").select("*").order("created_at"),
    supabaseAdmin.from("events").select("*").order("date"),
    supabaseAdmin.from("site_settings").select("*").single(),
  ]);

  const stock = (stockResult.data ?? []) as StockItem[];
  const coming = (comingResult.data ?? []) as ComingSoonItem[];
  const events = (eventsResult.data ?? []) as EventItem[];
  const s = settingsResult.data;
  const settings = {
    hours: s?.hours ?? "Open daylight hours, mid-March through end of June",
    stockUpdatedAt: s?.stock_updated_at ?? null,
  };

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <a href="#top" className="brand" aria-label="Peak Moon Nursery — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand-logo"
              src="/images/logo.png"
              alt="Peak Moon Nursery — Edible Plant Starts"
            />
          </a>
          <nav className="nav" aria-label="Primary">
            <a href="#stock">In Stock</a>
            <a href="#coming-soon">Coming Soon</a>
            <a href="#visit">Visit</a>
            <a href="#newsletter">Newsletter</a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">Small farm · Vashon Island, WA</p>
              <h1>
                Plants grown
                <br />
                by the moon,
                <br />
                <em>raised on the island.</em>
              </h1>
              <p className="lede">
                Selena and Keaton grow tried-and-true vegetable starts, herbs, and flowers chosen to
                thrive in the Pacific Northwest — with a soft spot for the unusual varieties you
                won&apos;t find at the big-box stores.
              </p>
              <div className="hero-cta">
                <a href="#stock" className="btn">
                  See what&apos;s in stock
                </a>
                <a href="#visit" className="btn btn-ghost">
                  How to find us
                </a>
              </div>
            </div>
            <div className="hero-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/gallery/nursery-bench.jpg"
                alt="Rows of vegetable starts on wooden benches in the forest-clearing nursery on Vashon Island"
              />
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="story">
          <div className="wrap story-inner">
            <div className="story-photos">
              <div className="photo photo-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/seeding-with-kash.jpg" alt="Keaton and baby Kash seeding trays in the greenhouse" />
              </div>
              <div className="photo photo-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/greenhouse-portrait.jpg" alt="Selena and Keaton in their greenhouse surrounded by hundreds of plant starts" />
              </div>
              <div className="photo photo-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/family.jpg" alt="Selena, Keaton, and Kash on the Vashon ferry" />
              </div>
            </div>
            <div className="story-copy">
              <p className="eyebrow">Our story</p>
              <h2>A small nursery with a big bench of starts.</h2>
              <p>
                Peak Moon is a young, family-run nursery just up the road from the Tahlequah ferry.
                We grow everything ourselves — over fifty varieties of tomatoes, plus peppers,
                cucumbers, squash, basil, eggplants, lettuce, flowers, and the occasional oddball we
                couldn&apos;t resist.
              </p>
              <p>
                We pick varieties that actually do well in our cool, wet springs and our short,
                beautiful summers. If we put it on the bench, it&apos;s because we&apos;d plant it
                in our own garden.
              </p>
              <p className="signed">— Selena &amp; Keaton</p>
            </div>
          </div>
        </section>

        {/* PHOTO GALLERY STRIP */}
        <div className="gallery-strip" aria-hidden="true">
          <div className="gallery-track">
            {(() => {
              const galleryImages = [
                { src: "/images/gallery/flower-sunflower.jpg", alt: "Unusual bi-color sunflower variety" },
                { src: "/images/gallery/hand-tomatoes.jpg", alt: "Hand holding a mix of colorful cherry tomatoes" },
                { src: "/images/gallery/pepper-harvest.jpg", alt: "A rainbow of pepper and eggplant varieties at harvest" },
                { src: "/images/gallery/tomato-toast.jpg", alt: "Open-face toast with sliced heirloom tomatoes and dill" },
                { src: "/images/gallery/bowl-tomatoes.jpg", alt: "Bowl of mixed heirloom tomatoes" },
                { src: "/images/gallery/harvest-tray.jpg", alt: "A full harvest tray of tomatoes, cucumbers, and beans" },
                { src: "/images/gallery/tomatoes-spread.jpg", alt: "Fifteen-plus tomato varieties spread out on a deck" },
              ];
              return [...galleryImages, ...galleryImages].map((img, i) => (
                <div key={`${img.src}-${i}`} className="gallery-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </div>
              ));
            })()}
          </div>
        </div>

        {/* IN STOCK */}
        <section id="stock" className="section section-stock">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">This week on the bench</p>
              <h2>What&apos;s in stock right now</h2>
              <p className="section-sub">
                Updated by Selena &amp; Keaton. Quantities are small and things move fast — if you
                see something you love, swing by soon.
              </p>
            </div>
            {stock.length === 0 ? (
              <div className="empty">
                The bench is empty right now — sign up for the newsletter for restock alerts!
              </div>
            ) : (
              <StockSection items={stock} />
            )}
            {settings.stockUpdatedAt && (
              <p className="section-foot">
                Last updated{" "}
                {new Date(settings.stockUpdatedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            )}
          </div>
        </section>

        {/* COMING SOON */}
        <section id="coming-soon" className="section section-coming">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">On deck</p>
              <h2>Coming up next</h2>
              <p className="section-sub">
                A peek at what we&apos;re hardening off in the greenhouse. Sign up below to get an
                email when these hit the bench.
              </p>
            </div>
            <div className="card-grid card-grid-soft" aria-live="polite">
              {coming.length === 0 ? (
                <div className="empty">Nothing announced yet — check back soon.</div>
              ) : (
                coming.map((item) => <ComingSoonCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        </section>

        {/* VISIT */}
        <section id="visit" className="section section-visit">
          <div className="wrap visit-inner">
            <div className="visit-copy">
              <p className="eyebrow">Find us</p>
              <h2>
                We&apos;re easy to miss
                <br />— but worth the turn.
              </h2>
              <p>
                We&apos;re on the west side of Vashon Highway, about a mile and a half up from the
                Tahlequah ferry. Look for our small wooden sign on the road; the entrance is{" "}
                <strong>300 feet north of 28815 Vashon Hwy SW</strong>.
              </p>
              <dl className="info-grid">
                <div>
                  <dt>Address</dt>
                  <dd>
                    Near 28815 Vashon Hwy SW
                    <br />
                    Vashon, WA 98070
                  </dd>
                </div>
                <div>
                  <dt>Coordinates</dt>
                  <dd>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=28815+Vashon+Hwy+SW+Vashon+WA+98070"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Google Maps ↗
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>{settings.hours}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>Cash, check, or Venmo</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    <a
                      href="https://www.instagram.com/peak_moon_nursery/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @peak_moon_nursery
                    </a>
                    <br />
                    <a
                      href="https://www.facebook.com/p/Peak-Moon-Nursery-61569684516791/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  </dd>
                </div>
              </dl>
              <div className="directions">
                <h3>From the Tahlequah ferry</h3>
                <ol>
                  <li>Drive off the ferry up the hill onto Vashon Highway SW.</li>
                  <li>
                    Continue north about <strong>1.5 miles</strong> — the road is the main one, you
                    can&apos;t really get lost.
                  </li>
                  <li>
                    Watch the <em>left side</em> for our little wooden sign just past 28815. The
                    driveway is 300 feet north of it.
                  </li>
                  <li>
                    If you reach SW 288th St, you&apos;ve gone slightly too far — turn around.
                  </li>
                </ol>
                <figure className="sign-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/sign.jpg"
                    alt="Peak Moon Nursery roadside sign — wooden sign reading 'Peak Moon Nursery — Edible Plant Starts'"
                  />
                  <figcaption>Look for this sign on the left side of the road.</figcaption>
                </figure>
              </div>
            </div>
            <div className="visit-map">
              <div className="map-frame">
                <iframe
                  title="Peak Moon Nursery location map"
                  src="https://www.google.com/maps?q=28815+Vashon+Hwy+SW,+Vashon,+WA+98070&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                className="map-link"
                href="https://www.google.com/maps/dir/?api=1&destination=28815+Vashon+Hwy+SW+Vashon+WA+98070"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get driving directions →
              </a>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section id="newsletter" className="section section-newsletter">
          <div className="wrap newsletter-inner">
            <div className="newsletter-copy">
              <p className="eyebrow">Stay in the loop</p>
              <h2>Email me when something good hits the bench.</h2>
              <p>
                We send a short note when new starts come in, when something sells out, and when
                we&apos;re going to be open. No spam, and you can unsubscribe any time.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <section id="events" className="section section-events">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Calendar</p>
              <h2>Upcoming open days &amp; events</h2>
            </div>
            <div className="event-list" aria-live="polite">
              {events.length === 0 ? (
                <div className="empty">No upcoming events on the calendar.</div>
              ) : (
                events.map((event) => <EventRow key={event.id} event={event} />)
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div>
            <p className="brand-name footer-brand">Peak Moon Nursery</p>
            <p className="muted">Vashon Island · grown by Selena &amp; Keaton</p>
          </div>
          <div className="footer-links">
            <a
              href="https://www.instagram.com/peak_moon_nursery/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/p/Peak-Moon-Nursery-61569684516791/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a href="/admin">Owner login</a>
          </div>
        </div>
      </footer>
    </>
  );
}
