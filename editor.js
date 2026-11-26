/* editor.js — Atomic Element Editor. Applies saved per-element overrides on every page; opens the editor with ?edit=1 (admin only).
   Saved in profile.styles.atoms[page][selector] = { d:{…desktop}, m:{…mobile ≤700px} }. No database change needed. */
(() => {
  const Q = new URLSearchParams(location.search), PG = (location.pathname.split("/").pop().replace(".html", "") || "index") + (Q.get("t") ? ":" + Q.get("t") : "");
  const px = v => /^-?\d+(\.\d+)?$/.test(String(v)) ? v + "px" : v, has = v => v !== undefined && v !== "" && v !== null;
  const SH = { soft: "0 8px 24px rgba(0,0,0,.18)", strong: "0 18px 50px rgba(0,0,0,.45)", glow: "0 0 30px rgba(255,214,120,.55)" };
  function decl(o) {
    const r = [], g = k => o[k];
    if (has(g("tx")) || has(g("ty"))) r.push(`translate:${px(g("tx") || 0)} ${px(g("ty") || 0)}`);
    if (has(g("rot"))) r.push(`rotate:${g("rot")}deg`); if (has(g("sc"))) r.push(`scale:${g("sc") / 100}`);
    [["w", "width"], ["h", "height"], ["mw", "max-width"], ["mt", "margin-top"], ["mr", "margin-right"], ["mb", "margin-bottom"], ["ml", "margin-left"], ["pt", "padding-top"], ["pr", "padding-right"], ["pb", "padding-bottom"], ["pl", "padding-left"], ["fs", "font-size"], ["ls", "letter-spacing"], ["br", "border-radius"]].forEach(([k, p]) => has(g(k)) && r.push(`${p}:${px(g(k))}`));
    if (has(g("ff")) && window.FONTS && FONTS[g("ff")]) { r.push("font-family:" + FONTS[g("ff")].c); useFont(g("ff")); }
    [["fw", "font-weight"], ["lh", "line-height"], ["ta", "text-align"], ["tt", "text-transform"], ["fst", "font-style"], ["color", "color"], ["bg", "background"], ["z", "z-index"]].forEach(([k, p]) => has(g(k)) && r.push(`${p}:${g(k)}`));
    if (has(g("z"))) r.push("position:relative"); if (has(g("op"))) r.push(`opacity:${g("op") / 100}`);
    if (has(g("bw"))) r.push(`border:${px(g("bw"))} solid ${g("bc") || "currentColor"}`); if (has(g("sh")) && SH[g("sh")]) r.push("box-shadow:" + SH[g("sh")]);
    if (has(g("blur"))) r.push(`filter:blur(${px(g("blur"))})`); if (g("hide")) r.push("display:none");
    return r.map(x => x + "!important").join(";");
  }
  const sheet = A => Object.entries(A || {}).map(([s, v]) => { const d = decl(v.d || {}), m = decl(v.m || {}); return (d ? `${s}{${d}}` : "") + (m ? `@media(max-width:700px){${s}{${m}}}` : ""); }).join("\n");
  let st = document.createElement("style"); st.id = "atoms"; document.head.appendChild(st);
  const prev = window.applyDesign; if (typeof prev === "function") window.applyDesign = p => { prev(p); try { st.textContent = sheet(((p || {}).styles || {}).atoms && p.styles.atoms[PG]); } catch (e) {} };

  /* admin entry button */
  const token = Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k));
  if (!/panel|admin|404/.test(location.pathname) && !Q.get("edit") && token) addEventListener("load", () => { const a = document.createElement("a"); a.href = location.pathname + "?" + (location.search ? location.search.slice(1) + "&" : "") + "edit=1"; a.textContent = "✎ Edit page"; a.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:95;background:#1d1d1f;color:#fff;font:600 12px system-ui;padding:9px 14px;border-radius:980px;text-decoration:none;opacity:.85"; document.body.appendChild(a); });
  if (!Q.get("edit")) return;

  const css = `#aed{position:fixed;right:0;top:0;bottom:0;width:min(350px,100vw);z-index:9999;background:#fff;color:#1d1d1f;font:13px/1.4 system-ui;overflow:auto;box-shadow:-8px 0 30px rgba(0,0,0,.25);padding:12px;-webkit-text-size-adjust:100%}#aed *{box-sizing:border-box;font:inherit;margin:0}#aed h4{font-size:15px;display:flex;justify-content:space-between;align-items:center}#aed code{display:block;font:11px monospace;color:#86868b;word-break:break-all;margin:6px 0 10px}
#aed details{border-top:1px solid #eee;padding:6px 0}#aed summary{font-weight:700;cursor:pointer;padding:6px 0}#aed .g{display:grid;grid-template-columns:1fr 1fr;gap:6px 8px}#aed label{display:block;font-size:11px;color:#6e6e73}#aed input,#aed select{width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:8px;background:#f7f7fa;font-size:13px}#aed input[type=color]{padding:2px;height:30px}#aed input[type=range]{padding:0}
#aed .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}#aed button{padding:7px 12px;border:1px solid #ddd;background:#fff;border-radius:980px;cursor:pointer;font-size:12px}#aed button.p{background:#0071e3;border-color:#0071e3;color:#fff}#aed button.on{background:#1d1d1f;color:#fff}#aed .m{color:#6e6e73;font-size:12px;min-height:16px}
#aedo{position:fixed;pointer-events:none;z-index:9998;border:2px solid #0a84ff;background:rgba(10,132,255,.08);border-radius:3px}#aedh{position:fixed;pointer-events:none;z-index:9997;border:1px dashed #ff9f0a}body.aeding{padding-right:min(350px,100vw)}.fxback,#fxcurtain{pointer-events:none}`;
  const FLD = [["Position", [["tx", "X offset px", "n"], ["ty", "Y offset px", "n"], ["rot", "Rotate °", "n"], ["sc", "Scale %", "n"], ["z", "Layer (z)", "n"]]],
    ["Size", [["w", "Width (px, %, auto)", "t"], ["h", "Height", "t"], ["mw", "Max width", "t"]]],
    ["Typography", [["ff", "Font", "f"], ["fs", "Size px", "n"], ["fw", "Weight", "w"], ["lh", "Line height", "n"], ["ls", "Letter-spacing px", "n"], ["ta", "Align", "a"], ["tt", "Case", "c"], ["fst", "Style", "i"]]],
    ["Colour", [["color", "Text colour", "k"], ["bg", "Background", "k"], ["bc", "Border colour", "k"]]],
    ["Spacing", [["mt", "Margin top", "n"], ["mr", "Margin right", "n"], ["mb", "Margin bottom", "n"], ["ml", "Margin left", "n"], ["pt", "Padding top", "n"], ["pr", "Padding right", "n"], ["pb", "Padding bottom", "n"], ["pl", "Padding left", "n"]]],
    ["Appearance", [["op", "Opacity %", "o"], ["br", "Corner radius", "n"], ["bw", "Border width", "n"], ["sh", "Shadow", "s"], ["blur", "Blur px", "n"], ["hide", "Hide element", "h"]]]];
  const OPT = { w: ["", "100", "200", "300", "400", "500", "600", "700", "800", "900"], a: ["", "left", "center", "right", "justify"], c: ["", "none", "uppercase", "lowercase", "capitalize"], i: ["", "normal", "italic"], s: ["", "soft", "strong", "glow"] };
  function ctl([k, l, t]) {
    if (t === "f") return `<label>${l}<select data-k="${k}"><option value="">Default</option>${window.fontOpts ? fontOpts() : ""}</select></label>`;
    if (OPT[t]) return `<label>${l}<select data-k="${k}">${OPT[t].map(v => `<option value="${v}">${v || "Default"}</option>`).join("")}</select></label>`;
    if (t === "k") return `<label>${l}<span style="display:flex;gap:4px"><input type="color" data-k="${k}" value="#000000"><button data-clr="${k}" type="button">✕</button></span></label>`;
    if (t === "o") return `<label>${l} <b data-v="${k}"></b><input type="range" min="0" max="100" data-k="${k}" value="100"></label>`;
    if (t === "h") return `<label style="display:flex;gap:6px;align-items:center;margin-top:18px"><input type="checkbox" data-k="${k}" style="width:auto">${l}</label>`;
    return `<label>${l}<input data-k="${k}" ${t === "n" ? 'type="number" step="1"' : ""} placeholder="—"></label>`;
  }
  const P = document.createElement("div"); P.id = "aed"; document.body.classList.add("aeding");
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
  const ov = document.createElement("div"); ov.id = "aedo"; ov.hidden = true; const hv = document.createElement("div"); hv.id = "aedh"; hv.hidden = true; document.body.append(ov, hv, P);
  let A = {}, base = {}, sel = null, selS = "", dev = "d", hist = [], admin = false;
  const ignore = c => /^(rv|in|on|hid|cur|fx-|aed|act|nb$|solid)/.test(c);
  function pathOf(e) {
    const parts = []; let n = e;
    while (n && n !== document.body && n.nodeType === 1) {
      if (n.id && !/^(aed|fx)/.test(n.id)) { parts.unshift("#" + CSS.escape(n.id)); break; }
      const sib = n.parentNode ? [...n.parentNode.children] : [n], i = sib.indexOf(n) + 1, cl = [...n.classList].filter(c => !ignore(c)).slice(0, 2).map(c => "." + CSS.escape(c)).join("");
      parts.unshift(n.tagName.toLowerCase() + cl + `:nth-child(${i})`); n = n.parentNode;
    }
    return parts.join(">");
  }
  const live = () => { st.textContent = sheet(A); };
  const get = () => ((A[selS] || {})[dev] || {});
  const set = (k, v) => { hist.push(JSON.stringify(A)); if (hist.length > 60) hist.shift(); const o = A[selS] = A[selS] || {}; o[dev] = o[dev] || {}; v === "" || v === false || v === null ? delete o[dev][k] : o[dev][k] = v; live(); box(); };
  function box() { if (!sel) return ov.hidden = true; const r = sel.getBoundingClientRect(); Object.assign(ov.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); ov.hidden = false; }
  function render() {
    const msg = P.querySelector(".m") ? P.querySelector(".m").textContent : "";
    P.innerHTML = `<h4>Element editor <button id="ax" type="button">Exit</button></h4><div class="row"><button data-dev="d" class="${dev === "d" ? "on" : ""}">🖥 Desktop</button><button data-dev="m" class="${dev === "m" ? "on" : ""}">📱 Mobile (≤700px)</button></div>
    ${sel ? `<code>${esc(selS)}</code><div class="row"><button id="up" type="button">↑ Parent</button><button id="rs" type="button">Reset element</button><button id="un" type="button">Undo</button></div>${FLD.map(([g, f], n) => `<details ${n < 3 ? "open" : ""}><summary>${g}</summary><div class="g">${f.map(ctl).join("")}</div></details>`).join("")}` : '<p class="m" style="margin:14px 0">Click any text, image or block on the page to edit it. Arrow keys nudge (Shift = 10px); drag to move.</p>'}
    <div class="row" style="position:sticky;bottom:0;background:#fff;padding:8px 0"><button class="p" id="sv" type="button">Save to site</button><button id="ra" type="button">Reset this page</button></div><p class="m">${esc(msg)}</p>`;
    P.querySelector("#ax").onclick = () => { location.href = location.pathname + location.search.replace(/[?&]edit=1/, "").replace(/^&/, "?"); };
    P.querySelectorAll("[data-dev]").forEach(b => b.onclick = () => { dev = b.dataset.dev; render(); });
    if (!sel) return P.querySelector("#sv").onclick = save, P.querySelector("#ra").onclick = () => { if (confirm("Remove every override on this page?")) { A = {}; live(); render(); } };
    const o = get(); P.querySelectorAll("[data-k]").forEach(i => { const k = i.dataset.k, v = o[k]; if (i.type === "checkbox") i.checked = !!v; else if (has(v)) i.value = v; else if (i.type === "range") i.value = 100;
      const sv = P.querySelector(`[data-v="${k}"]`); if (sv) sv.textContent = has(v) ? v : "";
      i.oninput = i.onchange = () => { const val = i.type === "checkbox" ? i.checked : i.type === "number" || i.type === "range" ? (i.value === "" ? "" : +i.value) : i.value; set(k, val); if (sv) sv.textContent = val; }; });
    P.querySelectorAll("[data-clr]").forEach(b => b.onclick = () => { set(b.dataset.clr, ""); render(); });
    P.querySelector("#up").onclick = () => { if (sel.parentElement && sel.parentElement !== document.body) pick(sel.parentElement); };
    P.querySelector("#rs").onclick = () => { delete A[selS]; live(); box(); render(); }; P.querySelector("#un").onclick = undo; P.querySelector("#sv").onclick = save;
    P.querySelector("#ra").onclick = () => { if (confirm("Remove every override on this page?")) { A = {}; live(); render(); } };
  }
  const undo = () => { const h = hist.pop(); if (h) { A = JSON.parse(h); live(); box(); render(); } };
  function pick(e) { sel = e; selS = pathOf(e); render(); box(); }
  async function save() {
    const m = P.querySelector(".m"); m.textContent = "Saving…";
    try { const { data } = await sb.from("profile").select("styles").eq("id", 1).maybeSingle(), s = Object.assign({}, (data || {}).styles), all = Object.assign({}, s.atoms);
      Object.keys(A).forEach(k => { const v = A[k]; if (!Object.keys(v.d || {}).length && !Object.keys(v.m || {}).length) delete A[k]; }); all[PG] = A; s.atoms = all;
      const { error } = await sb.from("profile").update({ styles: s }).eq("id", 1); m.textContent = error ? error.message : "Saved ✓ — live on the site."; } catch (e) { m.textContent = e.message; }
  }
  const inUI = t => t.closest && (t.closest("#aed") || t.closest("#aedo") || t.closest("#aedh"));
  document.addEventListener("pointermove", e => { if (inUI(e.target) || drag) return; const r = e.target.getBoundingClientRect(); Object.assign(hv.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); hv.hidden = false; }, true);
  let drag = null;
  document.addEventListener("click", e => { if (inUI(e.target)) return; e.preventDefault(); e.stopPropagation(); }, true);
  document.addEventListener("pointerdown", e => { if (inUI(e.target) || !admin) return; e.preventDefault(); const t = e.target; if (!sel || !(sel === t || sel.contains(t))) pick(t); const o = get(); drag = { x: e.clientX, y: e.clientY, tx: +o.tx || 0, ty: +o.ty || 0, moved: 0 }; }, true);
  document.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return; drag.moved = 1; const o = A[selS] = A[selS] || {}; o[dev] = o[dev] || {}; o[dev].tx = Math.round(drag.tx + dx); o[dev].ty = Math.round(drag.ty + dy); live(); box(); }, true);
  document.addEventListener("pointerup", () => { if (drag && drag.moved) { hist.push(JSON.stringify(A)); render(); } drag = null; }, true);
  document.addEventListener("keydown", e => { if (!sel || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); } return; } const d = e.shiftKey ? 10 : 1, mv = { ArrowLeft: ["tx", -d], ArrowRight: ["tx", d], ArrowUp: ["ty", -d], ArrowDown: ["ty", d] }[e.key]; if (mv) { e.preventDefault(); set(mv[0], (+get()[mv[0]] || 0) + mv[1]); render(); } });
  addEventListener("scroll", box, { passive: true }); addEventListener("resize", box);
  (async () => { try { const { data: { session } } = await sb.auth.getSession(); if (session) { const { data } = await sb.from("admins").select("user_id").maybeSingle(); admin = !!data; } } catch (e) {}
    if (!admin) { P.innerHTML = '<h4>Element editor</h4><p class="m" style="margin:14px 0">Sign in at <a href="panel.html">panel.html</a> as admin first, then reopen this page with ?edit=1.</p>'; return; }
    try { const { data } = await sb.from("profile").select("styles").eq("id", 1).maybeSingle(); A = JSON.parse(JSON.stringify((((data || {}).styles || {}).atoms || {})[PG] || {})); live(); } catch (e) {} render(); })();
})();
