// Daily Instagram story for @sublet.madrid, chosen and drawn by code.
//
//   node auto.mjs next [--date YYYY-MM-DD] [--force]   choose today's story (or stories), draw them into ../ig/auto/,
//                                                      write ../auto/pending.json and print the plan as JSON
//   node auto.mjs confirm                              after the stories are published: move pending.json into state.json
//   node auto.mjs preview                              draw every theme into ../auto/preview/ (never published)
//
// Run from src/ after `npm install`. See ../auto/README.md for the whole method.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import jpeg from "jpeg-js";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const P = (...p) => path.join(ROOT, ...p);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

const LISTINGS_URL = "https://flatmatch.uk/api/listings";
const RAW = "https://raw.githubusercontent.com/lihou32/sublet-madrid-media/main/";
const SITE = { madrid: "https://sublet-madrid.netlify.app/?city=madrid", london: "https://sublet-madrid.netlify.app/?city=london", both: "https://sublet-madrid.netlify.app/" };
const CITY_NAME = { madrid: "Madrid", london: "London" };

/* ---------- drawing (same look as build.mjs) ---------- */
const F = (p) => fs.readFileSync(path.join(import.meta.dirname, "node_modules/@fontsource", p));
const fonts = [
  { name: "Display", data: F("bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff"), weight: 800, style: "normal" },
  { name: "Display", data: F("bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff"), weight: 600, style: "normal" },
  { name: "Body", data: F("figtree/files/figtree-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "Body", data: F("figtree/files/figtree-latin-700-normal.woff"), weight: 700, style: "normal" },
];
const C = { cobalt: "#2347b5", deep: "#15203b", ochre: "#d1901a", paper: "#f3f5f9", white: "#ffffff" };
const h = (type, style = {}, ...children) => ({ type, props: { style: { display: "flex", ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) } });
const houseSvg = (size, stroke, bg) => ({ type: "svg", props: { width: size, height: size, viewBox: "0 0 32 32", children: [
  { type: "rect", props: { width: 32, height: 32, rx: 7, fill: bg } },
  { type: "path", props: { d: "M7 15l9-7 9 7M9 14v10h14V14", fill: "none", stroke, "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" } }] } });
const brand = (dark) => h("div", { alignItems: "center", gap: 22 },
  houseSvg(76, C.white, dark ? C.cobalt : "rgba(255,255,255,0.16)"),
  h("div", { fontFamily: "Display", fontWeight: 600, fontSize: 44, color: dark ? C.deep : C.white, letterSpacing: -0.5 }, "sublet.madrid"));
const pill = (text) => h("div", { alignSelf: "flex-start", background: C.ochre, color: "#2a1a00", fontFamily: "Body", fontWeight: 700, fontSize: 36, padding: "14px 30px", borderRadius: 999, letterSpacing: 1.5, textTransform: "uppercase" }, text);
const ICONS = {
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6",
  lock: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  choose: "M9 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M15.5 11l2 2l4.5-4.5",
  people: "M8 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7zM2 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5M16 11a3 3 0 1 0 0-6M17 14.5c2.8.3 5 2.2 5 5.5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5l4.5-5",
  eyeoff: "M3 12s3.5-6 9-6s9 6 9 6s-3.5 6-9 6s-9-6-9-6zM12 9.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5zM4 4l16 16",
  house: "M4 11l8-6 8 6M6 10v10h12V10",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  sun: "M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  pin: "M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 8a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5z",
};
const icon = (name, size, color) => ({ type: "svg", props: { width: size, height: size, viewBox: "0 0 24 24", children: [{ type: "path", props: { d: ICONS[name] || ICONS.house, fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" } }] } });
const frame = (dark, footer, ...middle) => h("div", { width: 888, height: 1370, background: dark ? C.paper : C.cobalt, flexDirection: "column", padding: "250px 96px 300px", justifyContent: "space-between" },
  brand(dark), ...middle,
  h("div", { width: 888, fontFamily: "Body", fontWeight: 700, fontSize: 38, color: dark ? C.cobalt : "rgba(255,255,255,0.9)" }, footer));
// a title and 4 icon steps joined by a line
function flow({ kicker, title, steps, theme, footer }) {
  const dark = theme === "paper", fg = dark ? C.deep : C.white, circle = 150;
  const rows = [];
  steps.forEach(([ic, label], i) => {
    if (i > 0) rows.push(h("div", { width: 8, height: 34, background: dark ? "rgba(35,71,181,0.35)" : "rgba(255,255,255,0.45)", marginLeft: circle / 2 - 4, borderRadius: 4 }));
    rows.push(h("div", { alignItems: "center", gap: 44 },
      h("div", { width: circle, height: circle, borderRadius: 999, background: dark ? C.cobalt : C.white, alignItems: "center", justifyContent: "center", flexShrink: 0 }, icon(ic, circle * 0.52, dark ? C.white : C.cobalt)),
      h("div", { fontFamily: "Display", fontWeight: 600, fontSize: label.length > 20 ? 54 : 64, color: fg, letterSpacing: -1 }, label)));
  });
  return frame(dark, footer, h("div", { flexDirection: "column", gap: 70, width: 888 },
    h("div", { flexDirection: "column", gap: 34 }, pill(kicker),
      h("div", { fontFamily: "Display", fontWeight: 800, fontSize: title.length > 24 ? 96 : 112, lineHeight: 1.0, color: fg, letterSpacing: -3 }, title)),
    h("div", { flexDirection: "column" }, rows)));
}
// a big title and one or two short lines
function announce({ kicker, title, lines, theme, footer, pin = true }) {
  const dark = theme === "paper", fg = dark ? C.deep : C.white;
  return frame(dark, footer, h("div", { flexDirection: "column", gap: 48, width: 888 },
    pill(kicker),
    h("div", { fontFamily: "Display", fontWeight: 800, fontSize: title.length > 22 ? 118 : 136, lineHeight: 1.0, color: fg, letterSpacing: -3 }, title),
    h("div", { flexDirection: "column", gap: 18 }, lines.map((t, i) => h("div", { alignItems: "center", gap: 22 },
      !pin ? null : i === 0 ? icon("pin", 62, dark ? C.cobalt : C.ochre) : h("div", { width: 62 }),
      h("div", { fontFamily: "Body", fontWeight: 700, fontSize: t.length > 30 ? 46 : 54, lineHeight: 1.25, color: dark ? "#3c4660" : "rgba(255,255,255,0.92)" }, t))))));
}
async function draw(spec, file) {
  const el = spec.template === "flow" ? flow(spec) : announce(spec);
  const svg = await satori(el, { width: 1080, height: 1920, fonts });
  const img = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, jpeg.encode({ data: img.pixels, width: img.width, height: img.height }, 92).data); // Instagram only takes JPEG
}

/* ---------- listings on the live site ---------- */
// The public route gives, for each place on the map: id, city and a blurred point. Nothing else, and nothing else is used here.
function fetchListings() {
  try {
    const out = execFileSync("curl", ["-sS", "-m", "30", "-L", LISTINGS_URL], { encoding: "utf8", maxBuffer: 5e6 });
    const arr = JSON.parse(out);
    if (!Array.isArray(arr)) throw new Error("not a list");
    return { ok: true, list: arr.filter((l) => l && /^[A-Z]{3}-[A-Z0-9]{3,10}$/.test(l.id) && CITY_NAME[l.city]).slice(0, 500)
      .map((l) => ({ id: l.id, city: l.city, c: Array.isArray(l.c) && l.c.length === 2 && l.c.every((n) => typeof n === "number" && Number.isFinite(n)) ? l.c : null })) };
  } catch (e) { return { ok: false, error: String(e.message || e).slice(0, 200), list: [] }; }
}
const DISTRICTS = readJson(P("auto/districts.json"), {});
function districtOf(l) {
  if (!l.c) return null;
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r, x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  let best = null;
  for (const d of DISTRICTS[l.city] || []) { const k = km(l.c, d.c); if (!best || k < best.k) best = { name: d.name, k }; }
  return best && best.k <= 2.5 ? best.name : null; // too far from every district we know: say only the city
}

/* ---------- choosing ---------- */
const args = process.argv.slice(2), cmd = args[0], flag = (n) => args.includes("--" + n), opt = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : null; };
const STATE = P("auto/state.json"), PENDING = P("auto/pending.json");
const themes = readJson(P("auto/themes.json"), []);
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
const alt = (s) => [s.title, ...(s.lines || []), ...(s.steps || []).map((x) => x[1])].map((x) => (/[.?!]$/.test(x) ? x : x + ".")).join(" ").replace(/\s+/g, " ").trim();

function themeSpec(t, counts, colour) {
  const v = { n: counts.madrid + counts.london, m: counts.madrid, l: counts.london };
  return { key: t.key, city: t.city, template: t.template, theme: colour, kicker: fill(t.kicker, v), title: fill(t.title, v),
    lines: (t.lines || []).map((x) => fill(x, v)), steps: t.steps, pin: t.pin !== false, footer: t.footer || "Tap the link to start", link: t.link || SITE[t.city] || SITE.both };
}
function newSpec(city, items, colour) {
  const n = items.length, names = [...new Set(items.map((x) => x.district).filter(Boolean))];
  const where = names.length ? (names.length > 2 ? names.slice(0, 2).join(" · ") + " and more" : names.join(" · ")) + (n === 1 ? " area" : "") : null;
  return { key: "new-" + city, city, template: "announce", theme: colour, kicker: "New on the map",
    title: n === 1 ? `New place in ${CITY_NAME[city]}` : `${n} new places in ${CITY_NAME[city]}`,
    lines: [where, "Students only, 1 week to 6 months"].filter(Boolean), footer: "Tap the link to see it", link: SITE[city], ids: items.map((x) => x.id) };
}

async function next() {
  const date = opt("date") || new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("bad date");
  const state = readJson(STATE, { seen: [], history: [] });
  if (!flag("force") && state.history.some((x) => x.date === date)) return console.log(JSON.stringify({ date, stories: [], reason: "already published today" }, null, 2));
  const got = fetchListings(), counts = { madrid: 0, london: 0 };
  got.list.forEach((l) => counts[l.city]++);
  const fresh = got.ok ? got.list.filter((l) => !state.seen.includes(l.id)).map((l) => ({ ...l, district: districtOf(l) })) : [];
  let colour = state.history.length % 2 ? "paper" : "cobalt";
  const flip = () => { const c = colour; colour = c === "cobalt" ? "paper" : "cobalt"; return c; };
  const specs = [];
  for (const city of ["madrid", "london"]) { const items = fresh.filter((l) => l.city === city); if (items.length) specs.push(newSpec(city, items, flip())); }
  if (!specs.length) {
    const month = Number(date.slice(5, 7)), last = (k) => { const hit = [...state.history].reverse().find((x) => x.key === k); return hit ? hit.date : ""; };
    const usable = themes.filter((t) => (!t.months || t.months.includes(month)) && (!t.minLive || (got.ok && counts.madrid + counts.london >= t.minLive)));
    // the theme used longest ago; never used comes first, in the order of themes.json
    const pick = usable.map((t, i) => ({ t, i, d: last(t.key) })).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.i - b.i))[0];
    if (!pick) throw new Error("no theme available");
    specs.push(themeSpec(pick.t, counts, flip()));
  }
  const stories = [];
  for (const s of specs) {
    const rel = `ig/auto/${date}-${s.key}.jpg`;
    await draw(s, P(rel));
    stories.push({ key: s.key, city: s.city, file: rel, url: RAW + rel, link: s.link, altText: alt(s), ids: s.ids || [] });
  }
  fs.writeFileSync(PENDING, JSON.stringify({ date, stories, seen: got.ok ? got.list.map((l) => l.id) : null }, null, 2) + "\n");
  console.log(JSON.stringify({ date, live: got.ok ? counts : null, listingsError: got.ok ? null : got.error, stories }, null, 2));
}
function confirm() {
  const p = readJson(PENDING, null);
  if (!p) throw new Error("nothing pending: run `next` first");
  const state = readJson(STATE, { seen: [], history: [] });
  if (p.seen) state.seen = [...new Set([...state.seen, ...p.seen])];
  for (const s of p.stories) state.history.push({ date: p.date, key: s.key, city: s.city, file: s.file });
  state.history = state.history.slice(-400);
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  fs.rmSync(PENDING);
  console.log(`recorded ${p.stories.length} story(ies) for ${p.date}`);
}
async function preview() {
  const counts = { madrid: 2, london: 2 }, out = [];
  let i = 0;
  for (const t of themes) { const f = P(`auto/preview/${t.key}.jpg`); await draw(themeSpec(t, counts, i++ % 2 ? "paper" : "cobalt"), f); out.push(f); }
  const samples = [newSpec("madrid", [{ id: "MAD-TEST", district: "Chamberí" }], "cobalt"), newSpec("london", [{ id: "LON-A", district: "Bloomsbury & King's Cross" }, { id: "LON-B", district: "Camden" }], "paper")];
  for (const s of samples) { const f = P(`auto/preview/${s.key}-${s.ids.length}.jpg`); await draw(s, f); out.push(f); }
  console.log(out.join("\n"));
}

if (cmd === "next") await next();
else if (cmd === "confirm") confirm();
else if (cmd === "preview") await preview();
else { console.error("usage: node auto.mjs next|confirm|preview"); process.exit(1); }
