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

if (!/panel|admin/.test(location.pathname) && localStorage.getItem("theme") === "dark") document.documentElement.dataset.theme = "dark";
let LBL = {}; const T_ = (k, d) => (LBL[k] || d);
const ar = v => /^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(v || "") ? ` style="aspect-ratio:${v}"` : "";
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
  if (f) { o.push("font-family:" + f.c + " !important"); useFont(st.font); }
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
  const n = k => st[k] !== undefined && st[k] !== "" && Number.isFinite(+st[k]) ? +st[k] : null;
  if (n("py") !== null || n("px") !== null) o.push(`padding:${n("py") || 0}px ${n("px") || 0}px`);
  if (n("my") !== null) o.push(`margin-top:${n("my")}px;margin-bottom:${n("my")}px`);
  if (n("mx") !== null) o.push(`margin-left:${n("mx")}px;margin-right:${n("mx")}px`);
  return o.join(";");
}
function sty(st) { const d = styDecl(st); return d ? ` style="${esc(d)}"` : ""; }

/* ---------- design + data ---------- */
let DESIGN = {};
function applyDesign(p) {
  DESIGN = p || {};
  const root = document.documentElement.style;
  root.setProperty("--r", Math.min(60, Math.max(0, Number.isFinite(+DESIGN.img_radius) && DESIGN.img_radius !== null ? +DESIGN.img_radius : 24)) + "px");
  [["theme_bg", "--bg"], ["theme_fg", "--fg"], ["theme_accent", "--blue"], ["theme_soft", "--soft"]].forEach(([k, v]) => { if (document.documentElement.dataset.theme !== "dark" && /^#[0-9a-f]{6}$/i.test(DESIGN[k] || "")) root.setProperty(v, DESIGN[k]); });
  root.setProperty("--ratio", ({ portrait: "4/5", square: "1/1", landscape: "4/3", wide: "16/9" })[DESIGN.img_ratio] || "4/5");
}
async function loadProfile() {
  const { data } = await sb.from("profile").select("*").eq("id", 1).maybeSingle();
  LBL = (data && data.labels) || {}; applyDesign(data || {});
  return data || {};
}
let REG = [];
async function loadSections() {
  const [a, b] = await Promise.all([sb.from("section_pages").select("*"), sb.from("sections").select("*").order("position")]);
  REG = b.data || [];
  REG.filter(r => ["custom", "favorites", "timeline", "capsule", "hidden"].includes(r.type)).forEach(r => MAP[r.key] = { label: r.title || r.key, text: "description", cover: "cover_url", table: "custom_items", filter: r.key, order: ["sort_order", "created_at"], meta: x => x.subtitle || "" });
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
  const links = REG.length ? REG.filter(r => r.visible && ["about", "travel", "collections", "journal", "custom", "favorites", "timeline", "capsule", "contact", "companies"].includes(r.type)).map(r => [r.key, r.type === "companies" ? (r.title || "Companies") : r.type === "about" ? (r.title || "About me") : r.type === "contact" ? "Contact" : T(r.key)])
    : [["about", "About me"], ["travel", T("travel")], ["collections", T("collections")], ["journal", T("journal")], ["contact", "Contact"]];
  const nav = document.createElement("nav"); nav.className = "nav" + (overHero ? "" : " solid");
  nav.innerHTML = `<a class="logo" href="${pre || "#"}">${logo ? `<img src="${esc(logo)}" style="height:${lh}px;border-radius:${Math.min(60, Math.max(0, +p.logo_radius || 0))}px" alt="Home">` : `<span>${esc(p.name || "Home")}</span>`}</a><div class="links">${links.map(([id, l]) => `<a href="${pre}#${id}">${esc(l)}</a>`).join("")}</div>`;
  nav.insertAdjacentHTML("beforeend", '<select class="lang" aria-label="Language"><option value="">Original</option><option value="bn">বাংলা</option><option value="en">English</option><option value="ar">العربية</option><option value="hi">हिन्दी</option><option value="es">Español</option><option value="fr">Français</option><option value="pt">Português</option></select>');
  nav.insertAdjacentHTML("beforeend", '<button class="dm" aria-label="Dark mode">◐</button>');
  nav.querySelector(".dm").onclick = () => { const d = document.documentElement.dataset.theme === "dark"; localStorage.setItem("theme", d ? "" : "dark"); location.reload(); };
  if (!onIndex) { nav.insertAdjacentHTML("afterbegin", '<button class="nb2" type="button" aria-label="Back">‹</button>'); nav.querySelector(".nb2").onclick = () => history.length > 1 ? history.back() : (location.href = "index.html"); }
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
    <div class="pic"${ar((r.styles || {})["ar." + c.cover])}>${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}</div>
    <div class="txt"><div class="meta">${esc(c.meta(r))}</div><h3${st_(r, "title")}>${esc(r.title)}</h3>${txt ? `<p${st_(r, c.text)}>${esc(txt)}</p>` : ""}<span class="more">${T_("viewdetails", "View details")} ›</span></div></a>`;
}
function card(t, r, i, off, peek) {
  const c = MAP[t], img = firstImg(r, c), txt = (r[c.text] || "").trim();
  return `<a class="ccard${peek ? " peek" : ""}" href="${link(t, r, peek)}">${cpic(r, img)}
    ${(r.category || c.meta(r)) ? `<span class="chip">${esc(r.category || c.meta(r))}</span>` : ""}<h3${st_(r, "title")}>${esc(r.title)}</h3>${txt ? `<p${st_(r, c.text)}>${esc(txt)}</p>` : ""}</a>`;
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
  return imgs.map((m, k) => { const n = reg ? reg.push(m) - 1 : k; return `<div class="sub${k % 2 ? " flip" : ""}"><div class="pic"${ar(m.ar)}>${media(m, n)}</div>
    <div class="txt">${m.caption ? `<p class="cap"${sty(m.style)}>${esc(m.caption)}</p>` : ""}</div></div>`; }).join("");
}
function subSections(list, reg) {
  return (list || []).filter(s => s && (s.title || (s.images || []).length)).map(s => `<div class="subsec">${s.title ? `<h2 class="sst"${sty(s.tstyle)}>${esc(s.title)}</h2>` : ""}${s.description ? `<div class="dtext"${sty(s.dstyle)}>${esc(s.description)}</div>` : ""}${subs((s.images || []).filter(m => m && m.url), reg)}</div>`).join("");
}
const coverHero = (u, a) => u ? `<div class="chero"${/^\d+\/\d+$/.test(a || "") ? ` style="height:auto;aspect-ratio:${a}"` : ""}><img class="zoom" src="${esc(u)}" alt=""></div>` : "";
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
    sb.from("analytics_events").insert(kind === "visit" ? Object.assign({ kind, key: String(key).slice(0, 40) }, envInfo()) : { kind, key: String(key).slice(0, 40) }).then(() => {});
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

/* ---- new section styles: favorites, timeline, time capsule ---- */
const rimg = r => r.cover_url || ((r.images || [])[0] || {}).url;
const AUD = new Audio(); AUD.loop = true;
function playTrack(b) {
  let mp = $("mp"); if (!mp) { mp = document.createElement("div"); mp.id = "mp"; document.body.appendChild(mp); }
  document.querySelectorAll(".disc").forEach(d => d.classList.toggle("cur", d === b));
  const sp = b.dataset.sp && b.dataset.sp.match(/(track|album|playlist|artist)\/(\w+)/);
  if (sp) { AUD.pause(); playSpotify(b, mp); return; }
  if (AUD._u === b.dataset.a && mp.querySelector(".mpd")) { AUD.paused ? AUD.play() : AUD.pause(); return; }
  mp.className = "on"; mp.innerHTML = '<i class="mpd"></i><span></span><button type="button">❚❚</button>';
  mp.querySelector("button").onclick = () => AUD.paused ? AUD.play() : AUD.pause(); AUD.onplay = () => document.body.classList.add("playing"); AUD.onpause = () => document.body.classList.remove("playing");
  mp.querySelector("span").textContent = b.dataset.t; mp.querySelector(".mpd").style.backgroundImage = b.dataset.c ? `url('${b.dataset.c}')` : "";
  AUD._u = b.dataset.a; AUD.src = b.dataset.a; AUD.play();
}
function favView(el, rows, key) {
  el.className = "fav";
  if (!rows.length) { el.innerHTML = '<p class="empty">Coming soon.</p>'; return; }
  const EM = [[/movie|film|series|cinema|drama|anime/i, "🎬"], [/book|novel|read/i, "📚"], [/food|dish|eat|cuisine|snack|drink/i, "🍜"], [/place|travel|city|spot|destination/i, "📍"], [/quote|line|word/i, "❝"], [/football|club|sport|team|player/i, "⚽"], [/music|song|album|playlist|artist|band/i, "🎧"], [/person|people|hero|icon|idol/i, "⭐"]];
  const kindOf = c0 => /movie|film|series|cinema|drama|anime/i.test(c0) ? "movie" : /book|novel|read/i.test(c0) ? "book" : /food|dish|eat|cuisine|snack|drink/i.test(c0) ? "food" : /place|travel|city|spot|destination/i.test(c0) ? "place" : /quote|line|word/i.test(c0) ? "quote" : /football|club|sport|team|player/i.test(c0) ? "club" : /music|song|album|playlist|artist|band/i.test(c0) ? "music" : /person|people|hero|icon|idol/i.test(c0) ? "person" : "other";
  const CTA = { movie: "Watch trailer", book: "Read more", food: "Find it", place: "Open map", club: "Official page", person: "Learn more", other: "Open link" };
  const star = n => n ? `<span class="fstar">${"★".repeat(Math.min(5, n))}${"☆".repeat(5 - Math.min(5, n))}</span>` : "";
  const by = {}; rows.forEach(r => (by[r.subtitle || "Favorites"] = by[r.subtitle || "Favorites"] || []).push(r));
  el.innerHTML = Object.entries(by).map(([cat, list]) => {
    const kind = kindOf(cat), em = (EM.find(x => x[0].test(cat)) || [0, "✨"])[1];
    return `<div class="fshelf"><h4 class="fcat"><span class="fem">${em}</span>${esc(cat)} <small>${list.length}</small></h4><div class="frow">${list.map((r, i) => {
      const href = `detail.html?t=${key}&id=${r.id}`, img = rimg(r), lk = safeUrl(r.link_url), meta = [r.creator, r.year].filter(Boolean).join(" · "), sp = r.spotify_url || ((String(r.description || "").match(/https?:\/\/open\.spotify\.com\/\S+/) || [])[0]) || "";
      if (kind === "music" || r.audio_url || sp) return `<button class="disc" type="button" data-a="${esc(r.audio_url || "")}" data-sp="${esc(sp)}" data-t="${esc(r.title)}" data-c="${esc(img || "")}"><i style="background-image:url('${esc(img || "")}')"></i><span>${esc(r.title)}</span><small>${esc(meta)}</small></button>`;
      if (kind === "quote") return `<a class="fq" href="${href}"><span>“</span><p dir="auto">${esc(r.title)}</p><small>${esc(r.creator || (r.description || "").slice(0, 60))}</small></a>`;
      return `<div class="fk ${kind}"><a class="fimg" href="${href}"${ar((r.styles || {})["ar.cover_url"])}>${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : ""}${i === 0 ? "<em>My #1</em>" : `<b>${i + 1}</b>`}</a><h5>${esc(r.title)}</h5>${meta ? `<small>${esc(meta)}</small>` : ""}${star(r.rating)}${lk ? `<a class="flk" href="${esc(lk)}" target="_blank" rel="noopener">${CTA[kind]} ›</a>` : ""}</div>`;
    }).join("")}</div></div>`;
  }).join("");
  el.querySelectorAll(".disc").forEach(b => { b.onclick = () => (b.dataset.a || b.dataset.sp) ? playTrack(b) : 0;
    if (b.dataset.sp && !b.dataset.c) fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent(b.dataset.sp)).then(r => r.json()).then(j => { if (j.thumbnail_url) { b.querySelector("i").style.backgroundImage = `url('${j.thumbnail_url}')`; b.dataset.c = j.thumbnail_url; } }).catch(() => {}); });
}
function capsuleView(el, rows, key) {
  useFont("caveat"); el.className = "caps";
  el.innerHTML = rows.length ? rows.map((r, i) => { const rot = `style="--rot:${(i % 3 - 1) * 1.6}deg"`; return r.open
    ? `<a class="env open" ${rot} href="detail.html?t=${key}&id=${r.id}"><small>Opened</small><h3 dir="auto">${esc(r.title)}</h3><p dir="auto">${esc((r.description || "").slice(0, 150))}</p></a>`
    : `<div class="env" ${rot}><i class="flap"></i><span class="seal"><svg viewBox="0 0 24 24" fill="none" stroke="#f6d4d4" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><div class="to">To: <b dir="auto">${esc(r.title)}</b></div><div class="cd" data-d="${esc(r.open_on)}"></div><small>Sealed until ${esc(fmt(r.open_on))}</small></div>`; }).join("") : '<p class="empty">Coming soon.</p>';
  const tick = () => el.querySelectorAll(".cd").forEach(p => { const s = Math.floor((new Date(p.dataset.d + "T00:00:00") - Date.now()) / 1e3); p.innerHTML = s <= 0 ? "Opening…" : `<div class="cdg">${[[Math.floor(s / 86400), "days"], [Math.floor(s % 86400 / 3600), "hrs"], [Math.floor(s % 3600 / 60), "min"], [s % 60, "sec"]].map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("")}</div>`; });
  tick(); setInterval(tick, 1000);
}
function tlView(el, rows, cfg, key) {
  useFont("caveat"); const spd = Math.min(10, Math.max(1, +cfg.speed || 5)), sec = 8 - spd * .6, first = cfg.dir === "down" ? 1 : 0, by = {};
  rows.forEach(r => (by[r.subtitle || "—"] = by[r.subtitle || "—"] || []).push(r));
  const years = Object.keys(by).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const panels = years.map((y, i) => {
    const imgs = by[y].flatMap(r => [r.cover_url ? { url: r.cover_url, caption: r.title } : null, ...(r.images || []).map(m => ({ url: m.url, type: m.type, caption: m.caption || r.title }))]).filter(m => m && m.url && m.type !== "video" && m.type !== "youtube").slice(0, 10);
    const col = [...imgs, ...imgs].map((m, k) => `<figure style="--r:${(k % 3 - 1) * 2}deg"><img src="${esc(m.url)}" alt="" loading="lazy" decoding="async"><figcaption>${esc(m.caption || "")}</figcaption></figure>`).join("");
    return `<div class="tlp"><div class="tly">${esc(y)}</div><div class="tlc"><div class="tli ${(i + first) % 2 ? "dn" : "up"}" style="--d:${Math.max(8, Math.round(imgs.length * sec))}s">${col}</div></div><div class="tlt">${by[y].map(r => `<a href="detail.html?t=${key}&id=${r.id}"><b>${esc(r.title)}</b><span dir="auto">${esc((r.description || "").slice(0, 150))}</span></a>`).join("")}</div></div>`;
  }).join("");
  el.className = "tl";
  el.innerHTML = `<div class="tlnav">${years.map((y, i) => `<a data-i="${i}">${esc(y)}</a>`).join("")}</div><div class="tlbar"><i></i></div><div class="tlr">${panels}</div><div class="tlbtn"><button class="tprev" type="button">← Previous</button><button class="tnext" type="button">Next →</button></div>`;
  const rail = el.querySelector(".tlr"), ps = [...rail.children], nav = [...el.querySelectorAll(".tlnav a")], bar = el.querySelector(".tlbar i"); let cur = 0;
  const go = i => { const p = ps[Math.max(0, Math.min(ps.length - 1, i))]; rail.scrollTo({ left: p.offsetLeft - (rail.clientWidth - p.offsetWidth) / 2, behavior: "smooth" }); };
  const upd = () => { const c0 = rail.scrollLeft + rail.clientWidth / 2; let b = 0, bd = 1e9; ps.forEach((p, i) => { const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - c0); if (d < bd) { bd = d; b = i; } }); cur = b; ps.forEach((p, i) => { p.classList.toggle("act", i === b); p.classList.toggle("nb", Math.abs(i - b) === 1); }); nav.forEach((a, i) => a.classList.toggle("on", i === b)); bar.style.width = ((b + 1) / ps.length * 100) + "%"; };
  rail.addEventListener("scroll", upd, { passive: true });
  ps.forEach((p, i) => p.onclick = () => go(i)); nav.forEach(a => a.onclick = () => go(+a.dataset.i));
  el.querySelector(".tprev").onclick = () => go(cur - 1); el.querySelector(".tnext").onclick = () => go(cur + 1);
  setTimeout(upd, 60);
}
/* ---- Hidden Room: a gate, then a private night sky with an astronaut ---- */
const ASTRO = '<svg class="astro" viewBox="0 0 64 80"><rect x="14" y="30" width="36" height="34" rx="12" fill="#e9ecf5"/><rect x="8" y="34" width="10" height="22" rx="5" fill="#cfd5e6"/><rect x="46" y="34" width="10" height="22" rx="5" fill="#cfd5e6"/><circle cx="32" cy="22" r="17" fill="#f4f6fb"/><ellipse cx="32" cy="22" rx="11" ry="9" fill="#1b2442"/><ellipse cx="29" cy="19" rx="4" ry="2.4" fill="#6f86d6" opacity=".7"/><rect x="22" y="62" width="8" height="14" rx="4" fill="#cfd5e6"/><rect x="34" y="62" width="8" height="14" rx="4" fill="#cfd5e6"/></svg>';
function roomView(el, key, cfg) {
  cfg = cfg || {}; const hexv = (v, d) => /^#[0-9a-f]{6}$/i.test(v || "") ? v : d;
  el.className = "room"; el.style.cssText = `--ra:${hexv(cfg.accent, "#e9e6df")};--rb:${hexv(cfg.bg, "#050505")}`;
  el.innerHTML = `<div class="rv1"><span class="rk">${esc(cfg.label || "Not for everyone")}</span><div class="gate"><i class="beam"></i><i class="gl"></i><i class="gr"></i><span class="gem"><svg viewBox="0 0 24 24"><circle cx="12" cy="9.5" r="3.4"/><path d="M12 13v6"/></svg></span></div><p class="rq">${esc(cfg.quote || "Beyond this gate there is a sky that is not on any map.")}</p><button class="rbtn" type="button">${esc(cfg.button || "Speak the word")}</button><form class="rpw" hidden><input type="password" placeholder="· · · · ·" autocomplete="off" aria-label="Password"><p class="msg"></p></form></div><div class="rin" hidden></div>`;
  const v = el.querySelector(".rv1"), g = el.querySelector(".gate"), f = el.querySelector(".rpw"), b = el.querySelector(".rbtn");
  const ask = () => { b.hidden = true; f.hidden = false; f.querySelector("input").focus(); }; b.onclick = ask; g.onclick = ask;
  f.onsubmit = async e => {
    e.preventDefault(); const m = f.querySelector(".msg"); m.textContent = "";
    const { data } = await sb.rpc("room_open", { k: key, pw: f.querySelector("input").value });
    if (!data) { m.textContent = "Not quite."; g.classList.add("no"); setTimeout(() => g.classList.remove("no"), 500); return; }
    g.classList.add("open"); f.hidden = true;
    setTimeout(() => v.classList.add("fade"), 1900);
    setTimeout(() => {
      v.hidden = true; const rin = el.querySelector(".rin"), pos = data.map((_, i) => [12 + (i * 37 + 11) % 74, 18 + (i * 53 + 7) % 58]);
      rin.innerHTML = `<div class="sky"></div>${ASTRO}` + (data.length ? `<svg class="rsvg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pos.map(p => p.join(",")).join(" ")}"/></svg>${data.map((r, i) => `<button class="star" type="button" data-i="${i}" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><i></i><span>${esc(r.title)}</span></button>`).join("")}<p class="rhin">Tap a star to receive its transmission.</p><div class="rcard" hidden></div>` : '<p class="rq" style="padding:60px 20px;position:relative">No signals yet… the sky is quiet.</p>');
      rin.hidden = false; rin.classList.add("in");
      const card = rin.querySelector(".rcard");
      rin.querySelectorAll(".star").forEach(s => s.onclick = () => {
        const n = +s.dataset.i, r = data[n], t = r.description || "";
        card.innerHTML = `<div class="hud"><span>● SIGNAL RECEIVED</span><span>LOG ${String(n + 1).padStart(3, "0")}</span></div><button class="rx" type="button">×</button><h3${st_(r, "title")}>${esc(r.title)}</h3><p dir="auto"${st_(r, "description")}></p><div class="rims">${[r.cover_url, ...(r.images || []).map(x => x && x.url)].filter(Boolean).slice(0, 6).map(u => `<img class="zm" src="${esc(u)}" alt="" loading="lazy">`).join("")}</div>`;
        card.hidden = false; const p = card.querySelector("p"); let k = 0; clearInterval(card._t);
        card._t = setInterval(() => { p.textContent = t.slice(0, k += 2); if (k >= t.length) clearInterval(card._t); }, 22);
        card.querySelector(".rx").onclick = () => { card.hidden = true; clearInterval(card._t); };
        card.querySelectorAll(".zm").forEach(im => im.onclick = () => openLB(im.src, ""));
      });
      const hin = rin.querySelector(".rhin"); hin && setTimeout(() => hin.style.opacity = 0, 6000);
    }, 3000);
  };
}

const LAY = { magazine: mag, grid: card, list: entry };
/* ---- travel map (Leaflet + OpenStreetMap) ---- */
function loadLeaflet() {
  return new Promise(ok => {
    if (window.L) return ok();
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"; s.onload = ok; document.head.appendChild(s);
  });
}
const GEO = "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";
const BD = { Barishal: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"], Chattogram: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"], Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"], Khulna: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"], Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"], Rajshahi: ["Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj"], Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"], Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"] };
async function mapView(el, rows, key, cfg) {
  cfg = cfg || {}; const col = /^#[0-9a-f]{6}$/i.test(cfg.color || "") ? cfg.color : "#e5484d", vc = new Set(cfg.countries || []), vd = new Set(cfg.districts || []);
  const pts = rows.map(r => { const m = String(r.latlng || "").match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/); return m ? { r, ll: [+m[1], +m[2]] } : null; }).filter(Boolean), dv = Object.values(BD);
  const dDone = dv.flat().filter(d => vd.has(d)).length, vDone = dv.filter(l => l.some(d => vd.has(d))).length;
  el.innerHTML = '<div class="mapwrap"><div class="tmap"></div><div class="mstats"></div></div>';
  const mc = (t, n, tot, sfx) => `<div class="mc"><small>${t}</small><b>${n}<span>${sfx || (tot ? "/" + tot : "")}</span></b><i class="mbar"><u style="width:${tot ? Math.round(n / tot * 100) : 0}%;background:${col}"></u></i><em>${tot ? Math.round(n / tot * 100) : 0}% explored</em></div>`;
  const stats = tot => el.querySelector(".mstats").innerHTML = mc("Bangladesh · districts", dDone, 64) + mc("Bangladesh · divisions", vDone, 8) + mc("World · countries", vc.size, tot);
  stats(0); await loadLeaflet();
  const map = L.map(el.querySelector(".tmap"), { scrollWheelZoom: false }).setView([20, 10], 2);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(map);
  try { const g = await (await fetch(GEO)).json(); L.geoJSON(g, { style: f => vc.has(f.properties.name) ? { color: col, weight: 1, fillColor: col, fillOpacity: .6 } : { weight: 0, fillOpacity: 0 }, interactive: false }).addTo(map); stats(g.features.length); } catch (e) {}
  pts.forEach(p => L.circleMarker(p.ll, { radius: 8, color: "#fff", weight: 2, fillColor: col, fillOpacity: 1 }).addTo(map).bindPopup(`<b>${esc(p.r.title)}</b><br><a href="detail.html?t=${key}&id=${p.r.id}">Open ›</a>`));
  pts.length > 1 ? map.fitBounds(pts.map(p => p.ll), { padding: [40, 40] }) : pts.length ? map.setView(pts[0].ll, 7) : 0;
}

/* coin (two overlapping circles) and banknote (two overlapping rectangles) slots for the Collection */
function cpic(r, img) {
  const k = r.shape === "normal" ? "" : r.shape === "coin" || r.shape === "note" ? r.shape : /coin/i.test(r.category || "") ? "coin" : /note/i.test(r.category || "") ? "note" : "", im = [r.cover_url, r.image2_url, ...(r.images || []).map(m => m && m.url)].filter(Boolean);
  if (k && im.length) return `<div class="pair ${k}"><i><img src="${esc(im[0])}" alt="" loading="lazy" decoding="async"></i>${im[1] ? `<i><img src="${esc(im[1])}" alt="" loading="lazy" decoding="async"></i>` : ""}</div>`;
  return `<div class="cpic"${ar((r.styles || {})["ar.cover_url"] || (r.styles || {})["ar.image_url"])}>${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}</div>`;
}

/* back links return to the page you really came from */
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a.back"); if (a && history.length > 1 && document.referrer.indexOf(location.origin) === 0) { e.preventDefault(); history.back(); } });

function envInfo() {
  const u = navigator.userAgent, q = new URLSearchParams(location.search); let ref = q.get("src") || "";
  if (!ref) { try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct"; if (ref === location.hostname) ref = "direct"; } catch (e) { ref = "direct"; } }
  const touch = navigator.maxTouchPoints > 1;
  const os = /Android/i.test(u) ? "Android" : /iPhone|iPod/i.test(u) ? "iOS" : /iPad/i.test(u) || (/Macintosh/.test(u) && touch) ? "iPadOS" : /Windows/i.test(u) ? "Windows" : /Mac OS/i.test(u) ? "macOS" : /Linux/i.test(u) ? "Linux" : "Other";
  const browser = /Edg\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /Chrome|CriOS/.test(u) ? "Chrome" : /Firefox|FxiOS/.test(u) ? "Firefox" : /Safari/.test(u) ? "Safari" : "Other";
  const device = /Mobi|iPhone|iPod/i.test(u) ? "Mobile" : /iPad|Tablet/i.test(u) || (/Macintosh/.test(u) && touch) || (/Android/i.test(u) && !/Mobile/i.test(u)) ? "Tablet" : "Desktop";
  let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  return { ref: ref.slice(0, 60), os, browser, device, tz, lang: (navigator.language || "").slice(0, 10) };
}

let SPAPI = null, SPC = null, SPU = null;
function spotifyApi() { return new Promise(ok => { if (SPAPI) return ok(SPAPI); window.onSpotifyIframeApiReady = a => { SPAPI = a; ok(a); }; const s = document.createElement("script"); s.src = "https://open.spotify.com/embed/iframe-api/v1"; s.async = true; document.body.appendChild(s); }); }
async function playSpotify(b, mp) {
  const m = b.dataset.sp.match(/(track|album|playlist|artist|episode)\/(\w+)/); if (!m) return; const uri = `spotify:${m[1]}:${m[2]}`;
  if (SPC && SPU === uri) { SPC.togglePlay(); return; }
  const api = await spotifyApi(); mp.className = "on sp"; mp.innerHTML = '<div id="spe"></div><button class="mpx" type="button">×</button>';
  mp.querySelector(".mpx").onclick = () => { try { SPC && SPC.pause(); } catch (e) {} mp.className = ""; mp.innerHTML = ""; SPC = SPU = null; document.body.classList.remove("playing"); };
  api.createController(mp.querySelector("#spe"), { uri, width: "100%", height: 80 }, ctl => { SPC = ctl; SPU = uri; ctl.addListener("ready", () => ctl.play()); ctl.addListener("playback_update", e => document.body.classList.toggle("playing", !!e.data && !e.data.isPaused && !e.data.isBuffering)); });
}
