const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"}) : "";
const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "";

/* refresh always starts from the top (hero) */
const IS_RELOAD = ((performance.getEntriesByType("navigation")[0]) || {}).type === "reload";
if (IS_RELOAD) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, 0);
}

const MAP = {
  travel:       { label: "Travel",       text: "description", cover: "cover_url", order: ["sort_order", "visited_on"],  meta: r => [[r.location, r.country].filter(Boolean).join(", "), fmt(r.visited_on)].filter(Boolean).join(" · ") },
  collections:  { label: "Collection",   text: "description", cover: "image_url", order: ["sort_order", "created_at"], meta: r => r.category || "" },
  journal:      { label: "Journal",      text: "body",        cover: "cover_url", order: ["written_on"],               meta: r => fmt(r.written_on) },
  achievements: { label: "Achievements", text: "description", cover: "image_url", order: ["sort_order", "achieved_on"], meta: r => fmt(r.achieved_on) },
  memories:     { label: "Memories",     text: "description", cover: "image_url", order: ["sort_order", "memory_date"], meta: r => fmt(r.memory_date) }
};

/* ---------- fonts (g = group, c = css, gf = Google font, m = has bold weight) ---------- */
const FONTS = {
  system:{n:"System (Apple style)",g:"Basic",c:'-apple-system,BlinkMacSystemFont,"Inter","Helvetica Neue",Arial,sans-serif'},
  inter:{n:"Inter",g:"Basic",c:'"Inter",sans-serif',gf:"Inter",m:1},
  poppins:{n:"Poppins",g:"Basic",c:'"Poppins",sans-serif',gf:"Poppins",m:1},
  montserrat:{n:"Montserrat",g:"Basic",c:'"Montserrat",sans-serif',gf:"Montserrat",m:1},
  lora:{n:"Lora",g:"Basic",c:'"Lora",Georgia,serif',gf:"Lora",m:1},
  playfair:{n:"Playfair Display",g:"Basic",c:'"Playfair Display",Georgia,serif',gf:"Playfair Display",m:1},
  poiret:{n:"Poiret One (elegant, art deco)",g:"Elegant",c:'"Poiret One",sans-serif',gf:"Poiret One"},
  cormorant:{n:"Cormorant Garamond (elegant serif)",g:"Elegant",c:'"Cormorant Garamond",Georgia,serif',gf:"Cormorant Garamond",m:1},
  cinzel:{n:"Cinzel (classic, luxury)",g:"Elegant",c:'"Cinzel",serif',gf:"Cinzel",m:1},
  bodoni:{n:"Bodoni Moda (fashion)",g:"Elegant",c:'"Bodoni Moda",serif',gf:"Bodoni Moda",m:1},
  greatvibes:{n:"Great Vibes (fancy script)",g:"Fancy",c:'"Great Vibes",cursive',gf:"Great Vibes"},
  pacifico:{n:"Pacifico (fancy, friendly)",g:"Fancy",c:'"Pacifico",cursive',gf:"Pacifico"},
  dancing:{n:"Dancing Script (fancy)",g:"Fancy",c:'"Dancing Script",cursive',gf:"Dancing Script",m:1},
  spacegrotesk:{n:"Space Grotesk (modern)",g:"Modern",c:'"Space Grotesk",sans-serif',gf:"Space Grotesk",m:1},
  dmsans:{n:"DM Sans (modern, clean)",g:"Modern",c:'"DM Sans",sans-serif',gf:"DM Sans",m:1},
  outfit:{n:"Outfit (modern, geometric)",g:"Modern",c:'"Outfit",sans-serif',gf:"Outfit",m:1},
  bebas:{n:"Bebas Neue (bold, tall)",g:"Bold",c:'"Bebas Neue",sans-serif',gf:"Bebas Neue"},
  anton:{n:"Anton (bold, heavy)",g:"Bold",c:'"Anton",sans-serif',gf:"Anton"},
  oswald:{n:"Oswald (bold, condensed)",g:"Bold",c:'"Oswald",sans-serif',gf:"Oswald",m:1},
  kaushan:{n:"Kaushan Script (brush)",g:"Brush",c:'"Kaushan Script",cursive',gf:"Kaushan Script"},
  yellowtail:{n:"Yellowtail (brush, retro)",g:"Brush",c:'"Yellowtail",cursive',gf:"Yellowtail"},
  marker:{n:"Permanent Marker (marker)",g:"Brush",c:'"Permanent Marker",cursive',gf:"Permanent Marker"},
  fredoka:{n:"Fredoka (funky, round)",g:"Funky",c:'"Fredoka",sans-serif',gf:"Fredoka",m:1},
  bangers:{n:"Bangers (funky, comic)",g:"Funky",c:'"Bangers",cursive',gf:"Bangers"},
  caveat:{n:"Caveat (handwriting)",g:"Funky",c:'"Caveat",cursive',gf:"Caveat",m:1},
  righteous:{n:"Righteous (funky, retro)",g:"Funky",c:'"Righteous",cursive',gf:"Righteous"}
};
const fontOpts = () => Object.entries(Object.entries(FONTS).reduce((a, [k, f]) => ((a[f.g] = a[f.g] || []).push([k, f.n]), a), {}))
  .map(([g, l]) => `<optgroup label="${g}">${l.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("")}</optgroup>`).join("");
const _fl = new Set();
function useFont(k) {
  const f = FONTS[k]; if (!f || !f.gf || _fl.has(k)) return; _fl.add(k);
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=" + f.gf.replace(/ /g, "+") + (f.m ? ":wght@400;700" : "") + "&display=swap";
  document.head.appendChild(l);
}
/* one text's saved style -> inline style attribute (sizes shrink gracefully on phones) */
function styDecl(st, exact) {
  if (!st || typeof st !== "object") return "";
  const o = [], f = FONTS[st.font];
  if (f) { o.push("font-family:" + f.c); useFont(st.font); }
  if (/^#[0-9a-f]{6}$/i.test(st.color || "")) o.push("color:" + st.color);
  const sz = +st.size;
  if (sz >= 8 && sz <= 300) {
    const lo = sz >= 48 ? Math.round(sz * .4) : sz >= 28 ? Math.round(sz * .55) : Math.min(sz, Math.max(13, Math.round(sz * .75)));
    o.push(exact ? `font-size:${sz}px` : `font-size:clamp(${lo}px,${(sz / 10).toFixed(2)}vw,${sz}px)`);
  }
  if (["left", "center", "right"].includes(st.align)) o.push("text-align:" + st.align);
  [["pad", "padding"], ["mt", "margin-top"], ["mb", "margin-bottom"]].forEach(([k, p]) => {
    if (st[k] !== undefined && st[k] !== "" && Number.isFinite(+st[k])) o.push(`${p}:${Math.max(-200, Math.min(400, +st[k]))}px`);
  });
  return o.join(";");
}
function sty(st) { const d = styDecl(st); return d ? ` style="${esc(d)}"` : ""; }

/* ---------- design + data ---------- */
let DESIGN = {};
function applyDesign(p) {
  DESIGN = p || {};
  const root = document.documentElement.style;
  root.setProperty("--r", Math.min(60, Math.max(0, Number.isFinite(+DESIGN.img_radius) && DESIGN.img_radius !== null ? +DESIGN.img_radius : 24)) + "px");
  [["theme_bg", "--bg"], ["theme_fg", "--fg"], ["theme_accent", "--blue"], ["theme_soft", "--soft"]].forEach(([k, v]) => { if (/^#[0-9a-f]{6}$/i.test(DESIGN[k] || "")) root.setProperty(v, DESIGN[k]); });
  root.setProperty("--ratio", ({ portrait: "4/5", square: "1/1", landscape: "4/3", wide: "16/9" })[DESIGN.img_ratio] || "4/5");
}
async function loadProfile() {
  const { data } = await sb.from("profile").select("*").eq("id", 1).maybeSingle();
  applyDesign(data || {});
  return data || {};
}
let REG = [];
async function loadSections() {
  const [a, b] = await Promise.all([sb.from("section_pages").select("*"), sb.from("sections").select("*").order("position")]);
  REG = b.data || [];
  REG.filter(r => r.type === "custom").forEach(r => MAP[r.key] = { label: r.title || r.key, text: "description", cover: "cover_url", table: "custom_items", filter: r.key, order: ["sort_order", "created_at"], meta: x => x.subtitle || "" });
  return Object.fromEntries((a.data || []).map(r => [r.key, r]));
}
function query(t) {
  const m = MAP[t]; let q = sb.from(m.table || t).select("*").eq("published", true);
  if (m.filter) q = q.eq("section_key", m.filter);
  MAP[t].order.forEach((k, i) => q = q.order(k, { ascending: t !== "journal" && i === 0, nullsFirst: false }));
  return q;
}

/* ---------- navigation with logo ---------- */
function buildNav(p, overHero, sp) {
  const onIndex = !/(section|detail|admin)(\.html)?$/.test(location.pathname), pre = onIndex ? "" : "index.html";
  const logo = safeUrl(p.logo_url), lh = Math.min(120, Math.max(16, +p.logo_h || 36));
  const names = { about: "About", contact: "Contact" };
  const T = k => (sp && sp[k] && sp[k].title) || MAP[k].label;
  const links = REG.length ? REG.filter(r => r.visible && ["about", "travel", "collections", "journal", "custom", "contact"].includes(r.type)).map(r => [r.key, r.type === "about" ? (r.title || "About me") : r.type === "contact" ? "Contact" : T(r.key)])
    : [["about", "About me"], ["travel", T("travel")], ["collections", T("collections")], ["journal", T("journal")], ["contact", "Contact"]];
  const nav = document.createElement("nav"); nav.className = "nav" + (overHero ? "" : " solid");
  nav.innerHTML = `<a class="logo" href="${pre || "#"}">${logo ? `<img src="${esc(logo)}" style="height:${lh}px;border-radius:${Math.min(60, Math.max(0, +p.logo_radius || 0))}px" alt="Home">` : `<span>${esc(p.name || "Home")}</span>`}</a><div class="links">${links.map(([id, l]) => `<a href="${pre}#${id}">${esc(l)}</a>`).join("")}</div>`;
  nav.insertAdjacentHTML("beforeend", '<select class="lang" aria-label="Language"><option value="">Original</option><option value="bn">বাংলা</option><option value="en">English</option></select>');
  const ls = nav.querySelector(".lang"); ls.value = LANG; ls.onchange = () => setLang(ls.value);
  document.body.prepend(nav);
  const pg = new URLSearchParams(location.search).get("t") || (/about/.test(location.pathname) ? "about" : null);
  if (pg) track("page", pg); else if (onIndex) track("visit", "home");
  loadTranslate();
  nav.querySelector(".logo").onclick = e => { if (onIndex) { e.preventDefault(); history.replaceState(null, "", location.pathname); scrollTo({ top: 0, behavior: "smooth" }); } };
  if (overHero) { const f = () => nav.classList.toggle("solid", scrollY > 40); addEventListener("scroll", f, { passive: true }); f(); }
}

/* ---------- lightbox ---------- */
function openLB(src, cap) {
  let lb = $("lb");
  if (!lb) { lb = document.createElement("div"); lb.id = "lb"; lb.className = "lb"; lb.innerHTML = '<img alt=""><p></p>'; lb.onclick = () => lb.classList.remove("on"); document.body.appendChild(lb); }
  lb.querySelector("img").src = src; lb.querySelector("p").textContent = cap || ""; lb.classList.add("on");
}

/* ---------- list blocks ---------- */
const firstImg = (r, c) => r[c.cover] || (((r.images || [])[0]) || {}).url;
const link = (t, r, peek) => peek ? `section.html?t=${t}` : `detail.html?t=${t}&id=${esc(r.id)}`;
const readTime = s => Math.max(1, Math.round((s || "").trim().split(/\s+/).filter(Boolean).length / 200)) + " min read";
const st_ = (r, k) => sty(r.styles && r.styles[k]);

function mag(t, r, i, off, peek) {
  const c = MAP[t], img = firstImg(r, c), side = DESIGN.side_mode;
  const flip = side === "left" ? false : side === "right" ? true : (i + off) % 2 === 1, txt = (r[c.text] || "").trim();
  return `<a class="mag${flip ? " flip" : ""}${peek ? " peek" : ""}" href="${link(t, r, peek)}">
    <div class="pic">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}</div>
    <div class="txt"><div class="meta">${esc(c.meta(r))}</div><h3${st_(r, "title")}>${esc(r.title)}</h3>${txt ? `<p${st_(r, c.text)}>${esc(txt)}</p>` : ""}<span class="more">View details ›</span></div></a>`;
}
function card(t, r, i, off, peek) {
  const c = MAP[t], img = firstImg(r, c), txt = (r[c.text] || "").trim();
  return `<a class="ccard${peek ? " peek" : ""}" href="${link(t, r, peek)}"><div class="cpic">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}</div>
    ${r.category ? `<span class="chip">${esc(r.category)}</span>` : ""}<h3${st_(r, "title")}>${esc(r.title)}</h3>${txt ? `<p${st_(r, c.text)}>${esc(txt)}</p>` : ""}</a>`;
}
function entry(t, r, i, off, peek) {
  const c = MAP[t], img = firstImg(r, c), txt = (r[c.text] || "").trim();
  return `<a class="jrow${peek ? " peek" : ""}" href="${link(t, r, peek)}"><div class="jdate">${esc(fmt(r.written_on))}</div>
    <div class="jmain"><h3${st_(r, "title")}>${esc(r.title)}</h3>${txt ? `<p${st_(r, c.text)}>${esc(txt)}</p>` : ""}<span class="jmeta">${readTime(r.body)}</span></div>
    ${img ? `<div class="jthumb"><img src="${esc(img)}" alt="" loading="lazy"></div>` : ""}</a>`;
}
const WRAP = { collections: "cgrid", journal: "jlist" };
const render = (t, r, i, off, peek) => (t === "collections" ? card : t === "journal" ? entry : mag)(t, r, i, off, peek);

/* sub pictures: zig-zag, each with its own description */
const ytId = u => (String(u || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) || [])[1];
function media(m, n) {
  const y = ytId(m.url);
  if (y) return `<iframe src="https://www.youtube.com/embed/${y}" allowfullscreen loading="lazy" allow="encrypted-media;picture-in-picture"></iframe>`;
  if (m.type === "video") return `<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>`;
  return `<img data-n="${n}" src="${esc(m.url)}" alt="" loading="lazy">`;
}
function subs(imgs, reg) {
  return imgs.map((m, k) => { const n = reg ? reg.push(m) - 1 : k; return `<div class="sub${k % 2 ? " flip" : ""}"><div class="pic">${media(m, n)}</div>
    <div class="txt">${m.caption ? `<p class="cap"${sty(m.style)}>${esc(m.caption)}</p>` : ""}</div></div>`; }).join("");
}
function subSections(list, reg) {
  return (list || []).filter(s => s && (s.title || (s.images || []).length)).map(s => `<div class="subsec">${s.title ? `<h2 class="sst"${sty(s.tstyle)}>${esc(s.title)}</h2>` : ""}${s.description ? `<div class="dtext"${sty(s.dstyle)}>${esc(s.description)}</div>` : ""}${subs((s.images || []).filter(m => m && m.url), reg)}</div>`).join("");
}
const coverHero = u => u ? `<div class="chero"><img class="zoom" src="${esc(u)}" alt=""></div>` : "";
function wireZoom(root, imgs) {
  root.querySelectorAll(".zoom").forEach(i => i.onclick = () => openLB(i.src, ""));
  root.querySelectorAll("[data-n]").forEach(i => i.onclick = () => openLB(i.src, (imgs[+i.dataset.n] || {}).caption));
}

/* ---------- contact icons ---------- */
const ICO = {
  email: ["#0a84ff", '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'],
  phone: ["#34c759", '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'],
  address: ["#ff453a", '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'],
  instagram: ["linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)", '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'],
  facebook: ["#1877f2", '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
  youtube: ["#ff0000", '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'],
  linkedin: ["#0a66c2", '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'],
  whatsapp: ["#25d366", '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'],
  telegram: ["#26a5e4", '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'],
  twitter: ["#111", '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>'],
  github: ["#24292f", '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'],
  tiktok: ["#111", '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'],
  website: ["#5856d6", '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>']
};
const ICON_NAMES = { auto: "Auto-detect", email: "Email", phone: "Phone", address: "Address / map", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", linkedin: "LinkedIn", telegram: "Telegram", twitter: "X / Twitter", github: "GitHub", tiktok: "TikTok", website: "Website" };
function iconKey(c) {
  if (c.icon && c.icon !== "auto" && ICO[c.icon]) return c.icon;
  const v = (c.value || "").toLowerCase(), t = (c.title || "").toLowerCase(), both = v + " " + t;
  for (const [k, re] of [["youtube", /youtu\.?be/], ["instagram", /instagram/], ["facebook", /facebook|fb\.(com|me)/], ["whatsapp", /whatsapp|wa\.me/], ["linkedin", /linkedin/], ["telegram", /telegram|t\.me/], ["twitter", /twitter|x\.com|\bx\b/], ["github", /github/], ["tiktok", /tiktok/]]) if (re.test(both)) return k;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "email";
  if (/^\+?[\d\s\-()]{6,}$/.test(v)) return "phone";
  if (/^https?:/.test(v)) return "website";
  if (/address|location|office|shop/.test(t)) return "address";
  return "website";
}
function contactHref(c, k) {
  const v = (c.value || "").trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (k === "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "mailto:" + v;
  if (/^\+?[\d\s\-()]{6,}$/.test(v)) return k === "whatsapp" ? "https://wa.me/" + v.replace(/\D/g, "") : "tel:" + v.replace(/[^\d+]/g, "");
  if (k === "address") return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v);
  return "";
}
function contactCards(list) {
  return list.map(c => {
    const k = iconKey(c), [bg, svg] = ICO[k], h = contactHref(c, k);
    const inner = `<span class="ci" style="background:${bg}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></span><span class="cx"><b>${esc(c.title)}</b><small>${esc(c.value)}</small></span>`;
    return h ? `<a class="cc" href="${esc(h)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="cc">${inner}</div>`;
  }).join("");
}

/* scroll-in animation */
function reveal(root = document) {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  [...root.querySelectorAll(".mag,.ccard,.jrow,.sub,.ab,.docs,.cc,.seemore,section>h2,.dintro")].filter(e => !e.classList.contains("rv") && !e.closest(".strip")).forEach(e => { e.classList.add("rv"); io.observe(e); });
}
/* right-to-left auto-scroll strip (speed 1..10) */
function startStrip(el, speed) {
  const tr = el.firstElementChild; if (!tr || !tr.children.length) return;
  const kids = [...tr.children], one = tr.scrollWidth, copies = Math.ceil(el.clientWidth / Math.max(one, 1)) + 1;
  for (let i = 1; i < copies; i++) kids.forEach(k => tr.appendChild(k.cloneNode(true)));
  const v = 12 + Math.min(10, Math.max(1, +speed || 5)) * 14; let x = 0, last = 0, hold = false;
  el.addEventListener("mouseenter", () => hold = true); el.addEventListener("mouseleave", () => hold = false);
  el.addEventListener("touchstart", () => hold = true, { passive: true }); el.addEventListener("touchend", () => setTimeout(() => hold = false, 1500));
  const step = t => { if (last && !hold) { x -= v * Math.min(.05, (t - last) / 1000); if (x <= -one) x += one; tr.style.transform = `translateX(${x}px)`; } last = t; requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* about section (summary on home, full on about.html) */
function bioHtml(p, hs, full) {
  const b = p.about_bio || "", docs = (p.about_docs || []).some(d => d && d.url);
  if (!b && (full || !docs)) return "";
  const w = b.match(/\S+\s*/g) || [], long = !full && w.length > 200;
  const more = !full && (long || docs) ? ' <a href="about.html" class="bm">See more…</a>' : "";
  return `<div class="bio"${sty(hs["about.bio"])}>${esc(long ? w.slice(0, 200).join("").trim() + "…" : b)}${more}</div>`;
}
function aboutView(p, full) {
  const hs = p.styles || {}, docs = (p.about_docs || []).filter(d => d && d.url);
  if (!(p.about_pic || p.about_headline || p.about_bio || p.about_facts || docs.length)) return "";
  const facts = (p.about_facts || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => { const i = l.includes("|") ? l.indexOf("|") : l.indexOf(":"); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ["", l]; });
  const h = Math.min(100, Math.max(50, +p.about_height || 60)), rad = Math.min(80, Math.max(0, Number.isFinite(+p.about_radius) ? +p.about_radius : 24));
  const v = ["start", "center", "end"].includes(p.about_valign) ? p.about_valign : "center", pic = safeUrl(p.about_pic);
  return `<section id="about"><div class="ab${p.about_side === "right" ? " right" : ""}">
    ${pic ? `<div class="abpic" style="--abh:${h}vh;--abr:${rad}px;--abv:${v}"><img class="zoom" src="${esc(pic)}" alt=""></div>` : ""}
    <div><div class="eyebrow"${sty(hs["about.title"])}>${esc(p.about_title || "About me")}</div>
      ${p.about_headline ? `<h3${sty(hs["about.headline"])}>${esc(p.about_headline)}</h3>` : ""}
      ${bioHtml(p, hs, full)}
      ${facts.length ? `<dl class="facts"${sty(hs["about.facts"])}>${facts.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>` : ""}</div></div>
    ${full && docs.length ? `<div class="docs"><h3${sty(hs["about.docs_title"])}>${esc(p.about_docs_title || "Licenses & Credentials")}</h3><div class="dgrid">${docs.map((d, n) => `<figure><img data-n="${n}" src="${esc(d.url)}" alt="" loading="lazy">${d.caption ? `<figcaption${sty(d.style)}>${esc(d.caption)}</figcaption>` : ""}</figure>`).join("")}</div></div>` : ""}</section>`;
}


/* privacy-friendly visit counting (no cookies, no IPs, once per browser session) */
function track(kind, key) {
  try {
    if (Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) return;
    const sk = "t:" + kind + ":" + key; if (sessionStorage.getItem(sk)) return; sessionStorage.setItem(sk, 1);
    sb.from("analytics_events").insert({ kind, key: String(key).slice(0, 40) }).then(() => {});
  } catch (e) {}
}
/* language switch (machine translation by Google Translate, only loaded when chosen) */
const LANG = ((document.cookie.match(/googtrans=\/[^/;]+\/(\w+)/) || [])[1]) || "";
function setLang(v) {
  const h = location.hostname, val = v ? "/auto/" + v : "", ex = v ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  ["", "; domain=" + h, "; domain=." + h].forEach(d => document.cookie = "googtrans=" + val + "; path=/" + ex + d);
  location.reload();
}
function loadTranslate() {
  if (!LANG) return;
  window.googleTranslateElementInit = () => new google.translate.TranslateElement({ autoDisplay: false }, "gt");
  const d = document.createElement("div"); d.id = "gt"; d.style.display = "none"; document.body.appendChild(d);
  const s = document.createElement("script"); s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"; document.head.appendChild(s);
}
