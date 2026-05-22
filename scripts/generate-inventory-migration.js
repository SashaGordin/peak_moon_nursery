#!/usr/bin/env node
/*
 * One-shot generator: produces a SQL migration that wipes and reseeds
 * stock_items from the client's 2026 inventory CSV, while preserving
 * image_url values from the live DB and merging descriptions from the
 * separate descriptions CSV.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/generate-inventory-migration.js
 *
 * Reads:
 *   - Inventory - Sheet1.csv (new inventory, columns: Species, Variety, $/pot, Pot Size)
 *   - Public Availability Plant list for descriptions - Plant Descriptions 2026.csv
 *   - public.stock_items.image_url from the configured Supabase project
 *
 * Writes:
 *   - supabase/migrations/<timestamp>_replace_inventory_2026.sql
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const INVENTORY_CSV = path.join(REPO_ROOT, "Inventory - Sheet1.csv");
const DESCRIPTIONS_CSV = path.join(
  REPO_ROOT,
  "Public Availability Plant list for descriptions - Plant Descriptions 2026.csv",
);
const MIGRATIONS_DIR = path.join(REPO_ROOT, "supabase", "migrations");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function norm(s) {
  if (s == null) return "";
  return String(s).replace(/\s+/g, " ").trim();
}

function sqlString(v) {
  if (v == null || v === "") return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function normalizePotSize(raw) {
  const v = norm(raw);
  if (!v) return null;
  if (/4-?pack/i.test(v)) return "4-pack";
  if (/^4"?$/i.test(v) || /4\s*inch/i.test(v)) return '4"';
  return v;
}

function combinedName(species, variety) {
  return `${species} (${variety})`;
}

function lookupKeys(species, variety) {
  const keys = new Set();
  const sp = norm(species);
  const va = norm(variety);
  const before = sp.split(",")[0].trim();
  // Live-DB convention: "Species, Variety" (comma joined)
  keys.add(`${sp}, ${va}`);
  if (before && before !== sp) keys.add(`${before}, ${va}`);
  // Descriptions-CSV / old-seed convention: "Species (Variety)"
  keys.add(combinedName(sp, va));
  if (before && before !== sp) keys.add(combinedName(before, va));
  return [...keys];
}

function buildImageVarietyIndex(imageMap) {
  // Index by (speciesRoot, variety) e.g. "Tomato, Sauce, Patio" → key "tomato|patio".
  // Only keep entries where the variety is unique within the species root.
  const counts = new Map();
  const byKey = new Map();
  for (const [name, url] of imageMap) {
    const segs = name.split(",").map((s) => s.trim());
    if (segs.length < 2) continue;
    const speciesRoot = segs[0].toLowerCase();
    const variety = segs[segs.length - 1].toLowerCase();
    const key = `${speciesRoot}|${variety}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    byKey.set(key, { url, fullName: name, speciesRoot, variety });
  }
  for (const [k, c] of counts) {
    if (c > 1) byKey.delete(k);
  }
  return byKey;
}

function matchImageByVariety(varietyIndex, species, variety) {
  if (!variety || !species) return null;
  const speciesRoot = species.split(",")[0].trim().toLowerCase();
  const v = variety.toLowerCase();
  const exactKey = `${speciesRoot}|${v}`;
  if (varietyIndex.has(exactKey)) return varietyIndex.get(exactKey);
  // Prefix fallback within same species: "Brandywine" → "Brandywine (Sudduth's strain)".
  for (const [key, val] of varietyIndex) {
    if (val.speciesRoot !== speciesRoot) continue;
    if (val.variety.startsWith(v + " (") || val.variety.startsWith(v + " ")) {
      return val;
    }
  }
  return null;
}

async function fetchExistingImageUrls() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
    console.error(
      "Tip: source your env or prefix the command — e.g. `set -a; . .env.local; set +a; node scripts/...`",
    );
    process.exit(1);
  }
  const endpoint =
    `${url.replace(/\/$/, "")}/rest/v1/stock_items` +
    `?select=name,image_url&image_url=not.is.null`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`ERROR fetching image_urls (${res.status}): ${body}`);
    process.exit(1);
  }
  const data = await res.json();
  const map = new Map();
  for (const row of data) {
    if (row.name && row.image_url) map.set(row.name, row.image_url);
  }
  return map;
}

function loadDescriptions() {
  const text = fs.readFileSync(DESCRIPTIONS_CSV, "utf8");
  const rows = parseCSV(text);
  const [, ...data] = rows;
  const map = new Map();
  for (const row of data) {
    if (!row[0] || !row[0].trim()) continue;
    const name = norm(row[0]);
    map.set(name, {
      description: norm(row[1]) || null,
      mature_height: norm(row[2]) || null,
      days_to_maturity: norm(row[3]) || null,
      growth_type: norm(row[4]) || null,
    });
  }
  return map;
}

function loadInventory() {
  const text = fs.readFileSync(INVENTORY_CSV, "utf8");
  const rows = parseCSV(text);
  const [header, ...data] = rows;
  if (!header || header.length < 4) {
    throw new Error("Inventory CSV missing expected header row");
  }
  return data
    .map((r) => ({
      species: norm(r[0]),
      variety: norm(r[1]),
      price: norm(r[2]),
      pot_size_raw: norm(r[3]),
    }))
    .filter((r) => r.species && r.variety);
}

function pickFirst(map, keys) {
  for (const k of keys) {
    if (map.has(k)) return { hit: map.get(k), key: k };
    const lk = k.toLowerCase();
    if (map.has(lk)) return { hit: map.get(lk), key: lk };
  }
  return null;
}

function lowerMap(m) {
  const out = new Map();
  for (const [k, v] of m) {
    out.set(k, v);
    out.set(k.toLowerCase(), v);
  }
  return out;
}

async function main() {
  const inventory = loadInventory();
  const descriptions = lowerMap(loadDescriptions());
  const imageUrlsRaw = await fetchExistingImageUrls();
  const imageUrls = lowerMap(imageUrlsRaw);
  const imageVarietyIndex = buildImageVarietyIndex(imageUrlsRaw);

  const warnings = [];
  const seen = new Set();
  let withDescription = 0;
  let withImage = 0;

  const valuesSql = inventory
    .map((row) => {
      const keys = lookupKeys(row.species, row.variety);
      const dedupKey = `${row.species}|${row.variety}`;
      if (seen.has(dedupKey)) {
        warnings.push(`Duplicate row: ${row.species} / ${row.variety}`);
      }
      seen.add(dedupKey);

      const desc = pickFirst(descriptions, keys);
      if (desc) withDescription++;

      let img = pickFirst(imageUrls, keys);
      if (!img) {
        const v = matchImageByVariety(imageVarietyIndex, row.species, row.variety);
        if (v) img = { hit: v.url, key: `variety:${v.fullName}` };
      }
      if (img) withImage++;

      const potSize = normalizePotSize(row.pot_size_raw);
      if (row.pot_size_raw && !potSize) {
        warnings.push(`Unrecognized pot size "${row.pot_size_raw}" for ${row.species} / ${row.variety}`);
      }

      const name = combinedName(row.species, row.variety);
      const category = row.species.split(",")[0].trim();
      const price = row.price || null;
      if (!price) {
        warnings.push(`Missing price for ${row.species} / ${row.variety}`);
      }

      return `  (${[
        sqlString(name),
        sqlString(category),
        sqlString(row.variety),
        sqlString(desc?.hit.description ?? null),
        sqlString(desc?.hit.mature_height ?? null),
        sqlString(desc?.hit.days_to_maturity ?? null),
        sqlString(desc?.hit.growth_type ?? null),
        sqlString(price),
        sqlString(potSize),
        sqlString(img?.hit ?? null),
      ].join(", ")})`;
    })
    .join(",\n");

  const ts = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);
  const outPath = path.join(MIGRATIONS_DIR, `${ts}_replace_inventory_2026.sql`);

  const sql = `-- Generated by scripts/generate-inventory-migration.js
-- Source: Inventory - Sheet1.csv (414 rows)
-- Preserves image_url values from live DB and merges descriptions from
-- "Public Availability Plant list for descriptions - Plant Descriptions 2026.csv".

begin;

alter table public.stock_items add column if not exists pot_size text;
alter table public.stock_items drop column if exists stock;

delete from public.stock_items;

insert into public.stock_items
  (name, category, variety, description, mature_height, days_to_maturity, growth_type, price, pot_size, image_url)
values
${valuesSql};

update public.site_settings set stock_updated_at = now();

commit;
`;

  fs.writeFileSync(outPath, sql);

  console.error(`Wrote ${outPath}`);
  console.error(`  rows inserted:    ${inventory.length}`);
  console.error(`  with description: ${withDescription}`);
  console.error(`  with image_url:   ${withImage}`);
  if (warnings.length) {
    console.error(`  warnings:         ${warnings.length}`);
    for (const w of warnings) console.error(`    - ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
