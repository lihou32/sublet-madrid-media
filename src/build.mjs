// Generates the Sublet Madrid Instagram visuals (stories, feed posts, highlight covers) as JPEG into public/.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import jpeg from "jpeg-js";
import fs from "node:fs";
import path from "node:path";

const F = (p) => fs.readFileSync(path.join("node_modules/@fontsource", p));
const fonts = [
  { name: "Display", data: F("bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff"), weight: 800, style: "normal" },
  { name: "Display", data: F("bricolage-grotesque/files/bricolage-grotesque-latin-600-normal.woff"), weight: 600, style: "normal" },
  { name: "Body", data: F("figtree/files/figtree-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "Body", data: F("figtree/files/figtree-latin-700-normal.woff"), weight: 700, style: "normal" },
];

const C = { cobalt: "#2347b5", deep: "#15203b", ochre: "#d1901a", paper: "#f3f5f9", white: "#ffffff" };

const h = (type, style = {}, ...children) => ({ type, props: { style: { display: "flex", ...style }, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) } });

// house icon (same shape as the site favicon)
const houseSvg = (size, stroke, bg) => ({
  type: "svg",
  props: {
    width: size, height: size, viewBox: "0 0 32 32",
    children: [
      bg ? { type: "rect", props: { width: 32, height: 32, rx: 7, fill: bg } } : null,
      { type: "path", props: { d: "M7 15l9-7 9 7M9 14v10h14V14", fill: "none", stroke, "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" } },
    ].filter(Boolean),
  },
});

const brand = (dark) =>
  h("div", { alignItems: "center", gap: 22 },
    houseSvg(76, dark ? C.white : C.white, dark ? C.cobalt : "rgba(255,255,255,0.16)"),
    h("div", { fontFamily: "Display", fontWeight: 600, fontSize: 44, color: dark ? C.deep : C.white, letterSpacing: -0.5 }, "sublet.madrid"));

const pill = (text, onDark) =>
  h("div", { alignSelf: "flex-start", background: C.ochre, color: "#2a1a00", fontFamily: "Body", fontWeight: 700, fontSize: 36, padding: "14px 30px", borderRadius: 999, letterSpacing: 1.5, textTransform: "uppercase" }, text);

// Story 1080x1920. Instagram covers ~250px top and bottom with UI, so content sits inside.
function story({ kicker, title, body, footer, theme = "cobalt", big }) {
  const dark = theme === "paper";
  const fg = dark ? C.deep : C.white;
  const sub = dark ? "#3c4660" : "rgba(255,255,255,0.86)";
  return h("div", { width: 888, height: 1370, background: dark ? C.paper : C.cobalt, flexDirection: "column", padding: "250px 96px 300px", justifyContent: "space-between" },
    brand(dark),
    h("div", { flexDirection: "column", gap: 44, width: 888 },
      kicker ? pill(kicker) : null,
      h("div", { fontFamily: "Display", fontWeight: 800, fontSize: big || 118, lineHeight: 1.02, color: fg, letterSpacing: -3 }, title),
      body ? h("div", { fontFamily: "Body", fontWeight: 500, fontSize: 50, lineHeight: 1.35, color: sub, whiteSpace: "pre-line" }, body) : null),
    h("div", { width: 888, fontFamily: "Body", fontWeight: 700, fontSize: 38, color: dark ? C.cobalt : "rgba(255,255,255,0.9)" }, footer || "sublet-madrid.netlify.app"));
}

// Feed post 1080x1350 (4:5)
function feed({ kicker, title, body, theme = "cobalt", footer }) {
  const dark = theme === "paper";
  const fg = dark ? C.deep : C.white;
  const sub = dark ? "#3c4660" : "rgba(255,255,255,0.86)";
  return h("div", { width: 900, height: 1170, background: dark ? C.paper : C.cobalt, flexDirection: "column", padding: "90px 90px 90px", justifyContent: "space-between" },
    brand(dark),
    h("div", { flexDirection: "column", gap: 40, width: 900 },
      kicker ? pill(kicker) : null,
      h("div", { fontFamily: "Display", fontWeight: 800, fontSize: 122, lineHeight: 1.0, color: fg, letterSpacing: -3 }, title),
      body ? h("div", { fontFamily: "Body", fontWeight: 500, fontSize: 46, lineHeight: 1.35, color: sub, whiteSpace: "pre-line" }, body) : null),
    h("div", { width: 900, fontFamily: "Body", fontWeight: 700, fontSize: 36, color: dark ? C.cobalt : "rgba(255,255,255,0.9)" }, footer || "Link in bio · sublet-madrid.netlify.app"));
}


// Grid centre tile: logo on ochre
function feedLogo() {
  return h("div", { width: 1080, height: 1350, background: C.ochre, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 },
    houseSvg(300, C.white, C.cobalt),
    h("div", { fontFamily: "Display", fontWeight: 800, fontSize: 110, color: C.deep, letterSpacing: -3 }, "sublet.madrid"),
    h("div", { fontFamily: "Body", fontWeight: 700, fontSize: 44, color: "#2a1a00" }, "Student sublets in Madrid"));
}


// Simple version (feedback 16/11: less text): title + 4 short points
function simple({ kicker, title, points, theme = "cobalt", format = "story" }) {
  const dark = theme === "paper";
  const fg = dark ? C.deep : C.white;
  const isStory = format === "story";
  const W = isStory ? 888 : 900, H = isStory ? 1370 : 1170;
  return h("div", { width: W, height: H, background: dark ? C.paper : C.cobalt, flexDirection: "column", padding: isStory ? "250px 96px 300px" : "90px 90px 90px", justifyContent: "space-between" },
    brand(dark),
    h("div", { flexDirection: "column", gap: isStory ? 64 : 48, width: W },
      pill(kicker),
      h("div", { fontFamily: "Display", fontWeight: 800, fontSize: isStory ? 124 : 116, lineHeight: 1.0, color: fg, letterSpacing: -3 }, title),
      h("div", { flexDirection: "column", gap: isStory ? 34 : 26 },
        points.map((t) => h("div", { alignItems: "center", gap: 30 },
          h("div", { width: 26, height: 26, borderRadius: 999, background: C.ochre, flexShrink: 0 }),
          h("div", { fontFamily: "Body", fontWeight: 700, fontSize: isStory ? 62 : 56, color: fg }, t))))),
    h("div", { width: W, fontFamily: "Body", fontWeight: 700, fontSize: isStory ? 38 : 36, color: dark ? C.cobalt : "rgba(255,255,255,0.9)" }, isStory ? "sublet-madrid.netlify.app" : "Link in bio"));
}


// Visual flow (feedback 16/11: fewer words, more diagrams): icon steps joined by a line
const ICONS = {
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6",
  lock: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  choose: "M9 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M15.5 11l2 2l4.5-4.5",
  euro: "M17 6.5A6 6 0 1 0 17 17.5M4 10h9M4 14h9",
  people: "M8 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7zM2 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5M16 11a3 3 0 1 0 0-6M17 14.5c2.8.3 5 2.2 5 5.5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5l4.5-5",
  eyeoff: "M3 12s3.5-6 9-6s9 6 9 6s-3.5 6-9 6s-9-6-9-6zM12 9.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5zM4 4l16 16",
  house: "M4 11l8-6 8 6M6 10v10h12V10",
};
const icon = (name, size, color) => ({ type: "svg", props: { width: size, height: size, viewBox: "0 0 24 24", children: [{ type: "path", props: { d: ICONS[name], fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" } }] } });
function flow({ kicker, title, steps, theme = "cobalt", format = "story" }) {
  const dark = theme === "paper";
  const fg = dark ? C.deep : C.white;
  const isStory = format === "story";
  const W = isStory ? 888 : 900, H = isStory ? 1370 : 1170;
  const circle = isStory ? 150 : 112, gapLine = isStory ? 34 : 18;
  const circleBg = dark ? C.cobalt : C.white, iconCol = dark ? C.white : C.cobalt;
  const lineCol = dark ? "rgba(35,71,181,0.35)" : "rgba(255,255,255,0.45)";
  const rows = [];
  steps.forEach(([ic, label], i) => {
    if (i > 0) rows.push(h("div", { width: 8, height: gapLine, background: lineCol, marginLeft: circle / 2 - 4, borderRadius: 4 }));
    rows.push(h("div", { alignItems: "center", gap: isStory ? 44 : 36 },
      h("div", { width: circle, height: circle, borderRadius: 999, background: circleBg, alignItems: "center", justifyContent: "center", flexShrink: 0 }, icon(ic, circle * 0.52, iconCol)),
      h("div", { fontFamily: "Display", fontWeight: 600, fontSize: isStory ? 64 : 54, color: fg, letterSpacing: -1 }, label)));
  });
  return h("div", { width: W, height: H, background: dark ? C.paper : C.cobalt, flexDirection: "column", padding: isStory ? "250px 96px 300px" : "90px 90px 90px", justifyContent: "space-between" },
    brand(dark),
    h("div", { flexDirection: "column", gap: isStory ? 70 : 44, width: W },
      h("div", { flexDirection: "column", gap: isStory ? 34 : 24 },
        pill(kicker),
        h("div", { fontFamily: "Display", fontWeight: 800, fontSize: isStory ? 112 : 92, lineHeight: 1.0, color: fg, letterSpacing: -3 }, title)),
      h("div", { flexDirection: "column" }, rows)),
    h("div", { width: W, fontFamily: "Body", fontWeight: 700, fontSize: 36, color: dark ? C.cobalt : "rgba(255,255,255,0.9)" }, isStory ? "sublet-madrid.netlify.app" : "Link in bio"));
}

// Highlight cover: Instagram crops the centre into a circle, so the icon is centred.
const icons = {
  how: "M9 9h14M9 16h14M9 23h9",
  looking: "M14 6a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM20 20l6 6",
  offering: "M7 15l9-7 9 7M9 14v10h14V14",
  safety: "M16 5l10 4v7c0 6-4.5 9.5-10 11c-5.5-1.5-10-5-10-11V9zM11.5 16l3.2 3.2l6-6.4",
  contact: "M6 8h20v13H13l-6 5v-5H6z",
};
function cover(key) {
  return h("div", { width: 1080, height: 1920, background: C.cobalt, alignItems: "center", justifyContent: "center" },
    h("div", { width: 520, height: 520, borderRadius: 999, background: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
      { type: "svg", props: { width: 300, height: 300, viewBox: "0 0 32 32", children: [{ type: "path", props: { d: icons[key], fill: "none", stroke: C.white, "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" } }] } }));
}

const items = {
  // highlight: How it works
  "story-how-1": story({ kicker: "How it works · 1/3", title: "Tell us your dates and budget", body: "30 seconds on our site, whether you're looking for a room or offering one." }),
  "story-how-2": story({ kicker: "How it works · 2/3", title: "We check every place", body: "On a video call, before it goes on the map. And every person too." }),
  "story-how-3": story({ kicker: "How it works · 3/3", title: "You see the zone first", body: "The exact address comes once it's a match. Then you meet on video before anything is paid." }),
  // highlight: Looking
  "story-looking-1": story({ kicker: "Looking", title: "Looking for a room in Madrid?", body: "For a semester or a summer. Tell us your dates and budget, we message you on WhatsApp when a checked place fits.", footer: "Tap the link to start" }),
  "story-looking-2": story({ kicker: "Looking", theme: "paper", title: "Only places we've seen", body: "Every room on the map has been checked on video. You only get places that fit your dates.", footer: "sublet-madrid.netlify.app" }),
  // highlight: Offering
  "story-offering-1": story({ kicker: "Offering", title: "Offering your room?", body: "Leaving Madrid for an exchange, an internship or the summer? Don't pay rent on an empty room.", footer: "Tap the link to list it" }),
  "story-offering-2": story({ kicker: "Offering", theme: "paper", title: "A student for your exact dates", body: "List your room in 30 seconds. Your address never appears on the site.", footer: "sublet-madrid.netlify.app" }),
  // highlight: Safety
  "story-safety-1": story({ kicker: "Safety", title: "Never send money before the video call", big: 108, body: "We check every place and every person. If anyone asks for a deposit before you've talked on video, tell us." }),
  // highlight: Contact
  "story-contact-1": story({ kicker: "Questions?", theme: "paper", title: "Send us a message", body: "WhatsApp +33 7 69 04 97 18\nor DM @sublet.madrid", footer: "sublet-madrid.netlify.app" }),
  // added 16/11: rules and fee
  "story-looking-3": story({ kicker: "Looking", title: "Everything goes through us", body: "We meet you in person or talk on WhatsApp, and we handle every step with the owner.", footer: "sublet-madrid.netlify.app" }),
  "story-offering-3": story({ kicker: "Offering", title: "We take 15% of the rent", body: "We find a student for your dates, check them and handle everything between you.", footer: "sublet-madrid.netlify.app" }),
  "story-safety-2": story({ kicker: "Safety", theme: "paper", title: "Always go through us", body: "Every message, visit and deal goes through Sublet Madrid. If anyone asks you to go around us, tell us.", footer: "sublet-madrid.netlify.app" }),
  // feed
  "feed-intro": feed({ title: "Student sublets in Madrid", body: "Rooms and flats for a semester or a summer. Every place checked on video." }),
  "feed-looking": feed({ kicker: "Looking", title: "Looking for a room in Madrid?", body: "Tell us your dates and budget. We message you when a checked place fits.", theme: "paper" }),
  "feed-offering": feed({ kicker: "Offering", title: "Offering your room?", body: "Leaving Madrid? We find a student for your exact dates. Your address stays private." }),
  "feed-how": feed({ kicker: "How it works", theme: "paper", title: "Three steps, that's it", body: "1. Tell us your dates and budget\n2. We check every place and every person\n3. You see the zone, the address comes once it's a match" }),
  "feed-logo": feedLogo(),
  "feed-safety": feed({ kicker: "Safety", theme: "paper", title: "Always go through us", body: "Every message, visit and deal goes through Sublet Madrid. Never send money before the video call." }),
  "feed-fee": feed({ kicker: "Offering", title: "We take 15% of the rent", body: "We find a student for your exact dates, check them and handle everything between you." }),
  "feed-checked": feed({ kicker: "Looking", theme: "paper", title: "Only places we've seen", body: "Every room on the map has been checked on video. You only get places that fit your dates." }),
  "feed-january": feed({ title: "Leaving or arriving in January?", body: "Tell us your dates in 30 seconds. We match students who leave with students who arrive." }),
  "story-offering-simple": simple({ kicker: "Offering", title: "Offering your room?", points: ["Add your dates", "Students only", "Address after they apply", "You choose"] }),
  "story-looking-simple": simple({ kicker: "Looking", theme: "paper", title: "Looking for a room?", points: ["Rooms from students", "Good prices", "Good roommates", "Flexible dates"] }),
  "feed-offering-simple": simple({ kicker: "Offering", title: "Offering your room?", points: ["Add your dates", "Students only", "Address after they apply", "You choose"], format: "feed" }),
  "feed-looking-simple": simple({ kicker: "Looking", theme: "paper", title: "Looking for a room?", points: ["Rooms from students", "Good prices", "Good roommates", "Flexible dates"], format: "feed" }),
  "story-offering-flow": flow({ kicker: "Offering", title: "Offering your room?", theme: "cobalt", format: "story", steps: [["calendar", "Add your dates"], ["cap", "Students only"], ["lock", "Address stays hidden"], ["choose", "You choose"]] }),
  "feed-offering-flow": flow({ kicker: "Offering", title: "Offering your room?", theme: "cobalt", format: "feed", steps: [["calendar", "Add your dates"], ["cap", "Students only"], ["lock", "Address stays hidden"], ["choose", "You choose"]] }),
  "story-looking-flow": flow({ kicker: "Looking", title: "Looking for a room?", theme: "paper", format: "story", steps: [["cap", "Rooms from students"], ["euro", "Good prices"], ["people", "Good roommates"], ["calendar", "Flexible dates"]] }),
  "feed-looking-flow": flow({ kicker: "Looking", title: "Looking for a room?", theme: "paper", format: "feed", steps: [["cap", "Rooms from students"], ["euro", "Good prices"], ["people", "Good roommates"], ["calendar", "Flexible dates"]] }),
  "story-trust-flow": flow({ kicker: "Trust", title: "Safe and discreet", theme: "cobalt", format: "story", steps: [["shield", "Every room checked"], ["lock", "Private address"], ["eyeoff", "Details kept private"], ["house", "Everything through us"]] }),
  "feed-trust-flow": flow({ kicker: "Trust", title: "Safe and discreet", theme: "cobalt", format: "feed", steps: [["shield", "Every room checked"], ["lock", "Private address"], ["eyeoff", "Details kept private"], ["house", "Everything through us"]] }),
  // covers
  "cover-how": cover("how"),
  "cover-looking": cover("looking"),
  "cover-offering": cover("offering"),
  "cover-safety": cover("safety"),
  "cover-contact": cover("contact"),
};

fs.mkdirSync("public", { recursive: true });
for (const [name, el] of Object.entries(items)) {
  const [width, height] = name.startsWith("feed") ? [1080, 1350] : [1080, 1920];
  const svg = await satori(el, { width, height, fonts });
  const img = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render();
  // Instagram's publishing API only takes JPEG
  const jpg = jpeg.encode({ data: img.pixels, width: img.width, height: img.height }, 92).data;
  fs.writeFileSync(`public/${name}.jpg`, jpg);
  console.log(name, jpg.length);
}
fs.writeFileSync("public/index.html", "<!doctype html><title>sublet.madrid media</title><p>Media for @sublet.madrid</p>");
