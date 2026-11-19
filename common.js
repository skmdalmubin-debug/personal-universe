const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"}) : "";
const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "";
const MAP = {
  travel:       { label: "Travel",       text: "description", cover: "cover_url", order: ["sort_order", "visited_on"],  meta: r => [[r.location, r.country].filter(Boolean).join(", "), fmt(r.visited_on)].filter(Boolean).join(" · ") },
  collections:  { label: "Collection",   text: "description", cover: "image_url", order: ["sort_order", "created_at"], meta: r => r.category || "" },
  journal:      { label: "Journal",      text: "body",        cover: "cover_url", order: ["written_on"],               meta: r => fmt(r.written_on) },
  achievements: { label: "Achievements", text: "description", cover: "image_url", order: ["sort_order", "achieved_on"], meta: r => fmt(r.achieved_on) },
  memories:     { label: "Memories",     text: "description", cover: "image_url", order: ["sort_order", "memory_date"], meta: r => fmt(r.memory_date) }
};
const FONTS = {
  system: ['-apple-system,BlinkMacSystemFont,"Inter","Helvetica Neue",Arial,sans-serif'],
  inter: ['"Inter",sans-serif', "Inter"],
  playfair: ['"Playfair Display",Georgia,serif', "Playfair Display"],
  poppins: ['"Poppins",sans-serif', "Poppins"],
  montserrat: ['"Montserrat",sans-serif', "Montserrat"],
  lora: ['"Lora",Georgia,serif', "Lora"]
};
let DESIGN = {};
function applyDesign(p) {
  p = p || {}; DESIGN = p;
  const root = document.documentElement.style, num = (v, d, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) && v !== null ? +v : d));
  root.setProperty("--r", num(p.img_radius, 24, 0, 60) + "px");
  root.setProperty("--fs", num(p.font_size, 17, 13, 26) + "px");
  if (/^#[0-9a-f]{6}$/i.test(p.text_color || "")) root.setProperty("--fg", p.text_color);
  const f = FONTS[p.font_family] || FONTS.system;
  document.body.style.fontFamily = f[0];
  if (f[1]) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(f[1]).replace(/%20/g, "+") + ":wght@400;600&display=swap"; document.head.appendChild(l); }
}
async function loadProfile() {
  const { data } = await sb.from("profile").select("*").eq("id", 1).maybeSingle();
  applyDesign(data || {});
  return data || {};
}
// magazine block. peek = faded teaser that links to the full section
function mag(t, r, i, off, peek) {
  const c = MAP[t], first = (r.images || [])[0], img = r[c.cover] || (first && first.url);
  const side = DESIGN.side_mode, flip = side === "left" ? false : side === "right" ? true : (i + off) % 2 === 1;
  const txt = (r[c.text] || "").trim(), href = peek ? `section.html?t=${t}` : `detail.html?t=${t}&id=${esc(r.id)}`;
  return `<a class="mag${flip ? " flip" : ""}${peek ? " peek" : ""}" href="${href}">
    <div class="pic">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}</div>
    <div class="txt"><div class="meta">${esc(c.meta(r))}</div><h3>${esc(r.title)}</h3>${txt ? `<p>${esc(txt)}</p>` : ""}<span class="more">View details ›</span></div></a>`;
}
function query(t) {
  let q = sb.from(t).select("*").eq("published", true);
  MAP[t].order.forEach((k, i) => q = q.order(k, { ascending: t !== "journal" && i === 0, nullsFirst: false }));
  return q;
}
