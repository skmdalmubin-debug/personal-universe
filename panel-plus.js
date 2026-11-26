/* panel-plus.js — Dashboard v2, command palette (Ctrl/⌘+K), dark mode, element-editor tab, company-section helpers, unsaved-changes guard. */
(() => {
  const E = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  document.documentElement.dataset.pp = localStorage.getItem("pp-theme") || "light";
  const go = k => { tab = k; shell(); };
  /* ---------- Dashboard v2 ---------- */
  async function dash() {
    const main = $("main"); main.innerHTML = '<p class="hint">Loading your dashboard…</p>';
    const iso = d => d.toISOString().slice(0, 10), d14 = iso(new Date(Date.now() - 13 * 864e5)), today = iso(new Date());
    const tabs = Object.entries(S).filter(([k, s]) => s.table && !s.custom && !s.single && !["guestbook", "profile", "analytics_events"].includes(s.table));
    const [vis, pend, appr, pro, ...cn] = await Promise.all([
      sb.from("analytics_events").select("day").eq("kind", "visit").gte("day", d14).limit(5000),
      sb.from("guestbook").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(6),
      sb.from("guestbook").select("id", { count: "exact", head: true }).eq("status", "approved"),
      sb.from("profile").select("name,tagline,hero_url,photo_url,about_bio,logo_url,styles").eq("id", 1).maybeSingle(),
      ...tabs.map(([k, s]) => { let q = sb.from(s.table).select("id", { count: "exact", head: true }); if (s.filter) q = q.eq("section_key", s.filter); return q; })]);
    const by = {}; (vis.data || []).forEach(r => by[r.day] = (by[r.day] || 0) + 1);
    const days = [...Array(14)].map((_, i) => iso(new Date(Date.now() - (13 - i) * 864e5))), vals = days.map(d => by[d] || 0), mx = Math.max(1, ...vals), P = pro.data || {};
    const sum = a => a.reduce((x, y) => x + y, 0), hr = new Date().getHours(), hi = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    const atoms = Object.entries((P.styles || {}).atoms || {}).reduce((n, [, v]) => n + Object.keys(v).length, 0);
    const chk = [[!!(P.hero_url || P.photo_url), "Hero photo set", "intro"], [!!P.tagline, "Tagline written", "intro"], [!!P.about_bio, "About bio written", "about"], [!!P.logo_url, "Logo uploaded", "logo"], [(cn[tabs.findIndex(t => t[0] === "companies")] || {}).count > 0, "At least one company published", "companies"], [(appr.count || 0) > 0, "Guest book has messages", "gb"]].filter(c => S[c[2]]);
    main.innerHTML = `<div class="pp-h">${hi}, ${E((P.name || "Mubin").split(" ")[0])} 👋</div><p class="pp-sub">Your world at a glance — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
    <div class="pp-grid"><div class="pp-card"><b>${by[today] || 0}</b><small>Visits today</small></div><div class="pp-card"><b>${sum(vals.slice(-7))}</b><small>Last 7 days</small></div><div class="pp-card"><b>${sum(vals)}</b><small>Last 14 days</small></div><div class="pp-card"><b>${(pend.data || []).length}</b><small>Guest book waiting</small></div><div class="pp-card"><b>${REG.filter(r => r.visible).length}/${REG.length}</b><small>Sections public</small></div><div class="pp-card"><b>${atoms}</b><small>Element tweaks</small></div></div>
    <div class="pp-sec"><h3>Visitors · 14 days</h3><div class="pp-card"><div class="pp-spark">${vals.map((v, i) => `<i style="height:${Math.round(v / mx * 100)}%" data-t="${days[i].slice(5)} · ${v}"></i>`).join("")}</div></div></div>
    <div class="pp-sec pp-two"><div><h3>Guest book · awaiting approval</h3>${(pend.data || []).length ? (pend.data).map(g => `<div class="pp-gb"><b>${E(g.name)}</b> <small>${E(g.location || "")}</small><p>${E(g.message)}</p><button class="pri" data-ap="${g.id}">Approve</button> <button class="del" data-dl="${g.id}">Delete</button></div>`).join("") : '<p class="hint" style="font-size:14px">Nothing waiting. ✨</p>'}<div class="actions" style="position:static;border:0;padding:12px 0 0"><button id="gbcsv">Export guest book (CSV)</button></div></div>
    <div><h3>Setup checklist</h3>${chk.map(([ok, t, k]) => `<div class="pp-chk ${ok ? "ok" : ""}"><i>${ok ? "✓" : ""}</i>${t}${ok ? "" : `<button data-q="${k}">Fix</button>`}</div>`).join("")}</div></div>
    <div class="pp-sec"><h3>Content</h3><div class="pp-card pp-list">${tabs.map(([k, s], i) => `<div><b>${E((TI[k] || "") + " " + s.label)}</b><small>${cn[i].count ?? 0} items</small><button data-q="${k}">Open</button></div>`).join("")}</div></div>
    <div class="pp-sec"><h3>Quick actions</h3><div class="qa">${[["atoms", "🎯", "Edit any element"], ["intro", "🏠", "Edit the hero"], ["companies", "🏢", "Companies"], ["travel", "✈", "Add a trip"], ["gb", "📕", "Guest book"], ["stats", "📊", "Visitors"], ["order", "↕", "Section order"], ["backup", "💾", "Backup"]].filter(x => S[x[0]]).map(([k, e, t]) => `<button data-q="${k}"><span>${e}</span>${t}</button>`).join("")}</div></div>`;
    main.querySelectorAll("[data-q]").forEach(b => b.onclick = () => go(b.dataset.q));
    main.querySelectorAll("[data-ap]").forEach(b => b.onclick = async () => { await sb.from("guestbook").update({ status: "approved" }).eq("id", b.dataset.ap); dash(); });
    main.querySelectorAll("[data-dl]").forEach(b => b.onclick = async () => { if (confirm("Delete this message?")) { await sb.from("guestbook").delete().eq("id", b.dataset.dl); dash(); } });
    $("gbcsv").onclick = async () => { const { data } = await sb.from("guestbook").select("*").order("created_at"); const c = ["name", "location", "message", "status", "created_at"]; const csv = [c.join(","), ...(data || []).map(r => c.map(k => '"' + String(r[k] ?? "").replace(/"/g, '""') + '"').join(","))].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "guestbook.csv"; a.click(); };
  }
  CUS.dash = dash;
  /* ---------- Element editor tab ---------- */
  S.atoms = { label: "Element editor", custom: "atoms" }; TI.atoms = "🎯"; TG.atoms = "Site";
  CUS.atoms = async () => {
    const { data } = await sb.from("profile").select("styles").eq("id", 1).maybeSingle(), at = ((data || {}).styles || {}).atoms || {};
    const pages = [["index", "Home", "index.html"], ["about", "About", "about.html"], ["companies", "Companies", "companies.html"]];
    $("main").innerHTML = `<p class="pp-note">Edit <b>any single element</b> — a word in the hero, one photo, a heading, a button — directly on the live page: position, size, font, colour, spacing, opacity, shadow, rotation, separately for desktop and mobile. Click an element, change it, press <b>Save to site</b>.</p>
    <div class="qa">${pages.map(([k, n, u]) => `<button data-open="${u}"><span>🖥</span>Edit ${n}<small style="color:var(--pp-mut)">${Object.keys(at[k] || {}).length} tweaks</small></button>`).join("")}</div>
    <div class="pp-sec"><h3>Open a specific section page</h3><div class="pp-chips">${REG.filter(r => r.visible && r.type !== "about").map(r => `<button data-open="section.html?t=${E(r.key)}">${E(r.title || r.key)}</button>`).join("")}</div></div>
    <div class="pp-sec"><h3>Saved tweaks</h3>${Object.entries(at).filter(([, v]) => Object.keys(v).length).map(([k, v]) => `<div class="pp-list"><div><b>${E(k)}</b><small>${Object.keys(v).length} elements</small><button class="del" data-rst="${E(k)}">Reset page</button></div></div>`).join("") || '<p class="hint" style="font-size:14px">None yet.</p>'}</div>`;
    $("main").querySelectorAll("[data-open]").forEach(b => b.onclick = () => window.open(b.dataset.open + (b.dataset.open.includes("?") ? "&" : "?") + "edit=1", "_blank"));
    $("main").querySelectorAll("[data-rst]").forEach(b => b.onclick = async () => { if (!confirm("Remove all tweaks on " + b.dataset.rst + "?")) return; const s = Object.assign({}, (data || {}).styles), a = Object.assign({}, s.atoms); delete a[b.dataset.rst]; s.atoms = a; await sb.from("profile").update({ styles: s }).eq("id", 1); CUS.atoms(); });
  };
  /* ---------- backup includes companies ---------- */
  CUS.backup = () => { $("main").innerHTML = '<p class="hint" style="font-size:14px;line-height:1.7">Downloads all text, settings, companies, links and guest book messages as one file. Photos stay in Supabase Storage; the file keeps their links.</p><div class="actions"><button class="pri" id="bk">Download backup</button></div><p class="msg" id="m"></p>';
    $("bk").onclick = async () => { const o = { exported: new Date().toISOString() }; for (const t of ["profile", "sections", "section_pages", "travel", "collections", "journal", "achievements", "memories", "custom_items", "contacts", "guestbook", "companies"]) { const { data } = await sb.from(t).select("*"); o[t] = data || []; } const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: "application/json" })); a.download = "site-backup-" + new Date().toISOString().slice(0, 10) + ".json"; a.click(); $("m").textContent = "Backup downloaded."; }; };
  /* ---------- decorate after every render ---------- */
  const PRE = ["Awards & recognition", "Clients & partners", "Certifications", "Press & media", "Social responsibility (CSR)", "Careers", "FAQ", "Our process"];
  const LINES = { values_text: "Integrity | We do what we say", products_text: "Product name | What it does", leaders_text: "Full name | Role | Short bio", milestones_text: "2025 | What happened", market_stats: "100+ | Clients served", links_text: "LinkedIn | https://" };
  function decorate() {
    const bar = $("app") && $("app").querySelector(".bar > span");
    if (bar && !bar.querySelector(".pp-k")) { const k = document.createElement("button"); k.className = "pp-k"; k.textContent = "⌘K Search"; k.onclick = pal; const t = document.createElement("button"); t.className = "pp-k"; t.textContent = "◐"; t.title = "Dark mode"; t.onclick = () => { const d = document.documentElement.dataset.pp === "dark" ? "light" : "dark"; document.documentElement.dataset.pp = d; localStorage.setItem("pp-theme", d); }; bar.prepend(k, t); }
    const x = document.querySelector('[data-k="extra_text"]');
    if (x && !x.dataset.pp) { x.dataset.pp = 1; x.insertAdjacentHTML("beforebegin", `<div class="pp-chips" data-pp><small style="color:var(--pp-mut);width:100%">+ Add your own section:</small>${PRE.map(p => `<button type="button" data-sec="${E(p)}">+ ${E(p)}</button>`).join("")}<button type="button" data-sec="">+ Custom…</button></div>`); x.previousElementSibling.onclick = e => { const b = e.target.closest("[data-sec]"); if (!b) return; let n = b.dataset.sec; if (!n) n = prompt("Section title?"); if (!n) return; x.value = (x.value.trim() ? x.value.replace(/\s*$/, "\n\n") : "") + "## " + n + "\n"; x.focus(); x.dispatchEvent(new Event("input", { bubbles: true })); }; }
    Object.keys(LINES).forEach(k => { const t = document.querySelector(`[data-k="${k}"]`); if (t && !t.dataset.pp) { t.dataset.pp = 1; t.insertAdjacentHTML("afterend", `<div class="pp-chips"><button type="button" data-ln>+ Add a line (${E(LINES[k])})</button></div>`); t.nextElementSibling.firstChild.onclick = () => { t.value = (t.value.trim() ? t.value.replace(/\s*$/, "\n") : "") + LINES[k]; t.focus(); }; } });
  }
  new MutationObserver(() => { clearTimeout(decorate._t); decorate._t = setTimeout(decorate, 60); }).observe(document.body, { childList: true, subtree: true });
  /* ---------- command palette ---------- */
  function pal() {
    let p = $("ppk"); if (!p) { p = document.createElement("div"); p.id = "ppk"; p.innerHTML = '<div><input placeholder="Jump to… (type to search)" aria-label="Search"><ul></ul></div>'; document.body.appendChild(p); p.onclick = e => { if (e.target === p) p.classList.remove("on"); }; }
    const inp = p.querySelector("input"), ul = p.querySelector("ul"); let n = 0;
    const draw = () => { const q = inp.value.toLowerCase(), l = Object.keys(S).filter(k => (S[k].label + " " + k).toLowerCase().includes(q)); n = Math.min(n, l.length - 1); ul.innerHTML = l.map((k, i) => `<li data-k="${k}" class="${i === n ? "on" : ""}">${E((TI[k] || "") + " " + S[k].label)}</li>`).join(""); ul._l = l; };
    const pick = k => { if (!k) return; p.classList.remove("on"); go(k); };
    inp.oninput = () => { n = 0; draw(); }; ul.onclick = e => { const li = e.target.closest("li"); li && pick(li.dataset.k); };
    inp.onkeydown = e => { if (e.key === "ArrowDown") { n = Math.min(n + 1, ul._l.length - 1); draw(); e.preventDefault(); } else if (e.key === "ArrowUp") { n = Math.max(0, n - 1); draw(); e.preventDefault(); } else if (e.key === "Enter") pick(ul._l[n]); else if (e.key === "Escape") p.classList.remove("on"); };
    inp.value = ""; n = 0; draw(); p.classList.add("on"); inp.focus();
  }
  /* ---------- shortcuts + unsaved guard ---------- */
  let dirty = false;
  document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && $("save")) { e.preventDefault(); $("save").click(); dirty = false; } });
  document.addEventListener("input", e => { if (e.target.closest && e.target.closest("#main") && !e.target.closest("#ppk")) dirty = true; });
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#save")) setTimeout(() => dirty = false, 800); });
  addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  decorate();
})();
