/* fx.js — motion + museum + back button. Safe: respects prefers-reduced-motion, ?fx=off, and pauses work off-screen. */
(() => {
  const D = document, R = D.documentElement, $q = (s, r = D) => r.querySelector(s), $a = (s, r = D) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches, off = /fx=off/.test(location.search) || localStorage.getItem("fx-off") === "1";
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches, admin = /panel|admin/.test(location.pathname);
  const home = /\/(index\.html)?$/.test(location.pathname), motion = !reduce && !off && !admin;
  if (motion) R.classList.add("fx-on"); if (off) R.classList.add("fx-off");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = css => { const s = D.createElement("style"); s.textContent = css; D.head.appendChild(s); };

  /* 1 · back button on every page (standalone pages too) */
  function back() {
    if (home || $q(".nb2") || $q(".fxback")) return;
    const b = D.createElement("button"); b.className = "fxback"; b.type = "button"; b.setAttribute("aria-label", "Previous page"); b.textContent = "‹";
    b.onclick = () => (history.length > 1 && D.referrer.indexOf(location.origin) === 0) ? history.back() : (location.href = "index.html");
    D.body.appendChild(b);
  }
  const nocv = () => { R.classList.add("fx-nocv"); clearTimeout(nocv.t); nocv.t = setTimeout(() => R.classList.remove("fx-nocv"), 2500); };
  if (location.hash) nocv(); D.addEventListener("click", e => { if (e.target.closest && e.target.closest('a[href*="#"]')) nocv(); }, true);
  addEventListener("load", () => setTimeout(back, 700)); if (!motion) return;

  /* 2 · preloader curtain (home, once per session) */
  if (home && !sessionStorage.getItem("fx-c")) { sessionStorage.setItem("fx-c", 1); const c = D.createElement("div"); c.id = "fxcurtain"; c.innerHTML = "<i></i>"; D.body.appendChild(c); const go = () => { c.classList.add("go"); setTimeout(() => c.remove(), 1200); }; addEventListener("load", () => setTimeout(go, 350)); setTimeout(go, 3500); }

  /* progress bar */
  const bar = D.createElement("div"); bar.id = "fxbar"; D.body.appendChild(bar);

  /* 3 · hero: "Al" slides left, "Mubin" slides right, both drop as you scroll */
  let hero = null;
  function setupHero() {
    hero = $q("#hero"); const h = hero && $q(".hn", hero); if (!h || h.dataset.fx) return; h.dataset.fx = 1;
    const w = h.textContent.trim().split(/\s+/); h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = w.map((t, k) => `<span class="w" aria-hidden="true" style="--k:${k};--dir:${w.length > 1 ? (k === 0 ? -1 : k === w.length - 1 ? 1 : 0) : 0}"><i>${esc(t)}</i></span>`).join(" ");
    if (window.HERO_FG_URL) hero.insertAdjacentHTML("beforeend", `<img class="hfg" src="${esc(window.HERO_FG_URL)}" alt="">`);
    const first = $q("main section[id]"); hero.insertAdjacentHTML("beforeend", `<a class="cue" href="#${first ? first.id : "main"}">Scroll<i></i></a>`);
  }

  /* 4 · section enhancers (idempotent; run after DOM changes) */
  const KIND = { movie: ["The Cinema Wall", "Now showing"], book: ["The Reading Room", "On the shelf"], music: ["The Listening Room", "On the turntable"], food: ["The Tasting Table", "Served"], place: ["The Postcard Wall", "Pinned"], person: ["The Portrait Gallery", "On display"], club: ["The Trophy Cabinet", "In the cabinet"], quote: ["The Inscriptions", "Engraved"], other: ["The Collection", "On display"] };
  function favourites() {
    $a(".fav:not([data-fx])").forEach(f => {
      f.dataset.fx = 1; const sec = f.closest("section"); if (!sec) return; sec.classList.add("fav-museum", "fx-glow"); useF();
      const shelves = $a(".fshelf", f), links = [];
      shelves.forEach((s, n) => {
        const k = s.querySelector(".disc") ? "music" : s.querySelector(".fq") ? "quote" : ((s.querySelector(".fk") || {}).className || "").split(" ")[1] || "other", kd = KIND[k] || KIND.other;
        s.dataset.kind = k; s.id = s.id || `${sec.id}-g${n + 1}`; const cat = (s.querySelector(".fcat") || {}).firstChild;
        const fc = s.querySelector(".fcat").cloneNode(true); fc.querySelectorAll(".fem,small").forEach(x => x.remove()); const nm = fc.textContent, cnt = s.querySelectorAll(".fk,.fq,.disc").length;
        s.querySelector(".fcat").insertAdjacentHTML("afterend", `<div class="fwall"><b>${kd[0]}</b>${cnt} ${cnt === 1 ? "work" : "works"} · ${kd[1].toLowerCase()}</div>`);
        links.push(`<a href="#${s.id}">${esc(nm.replace(/\d+\s*$/, "").trim())}</a>`);
      });
      if (shelves.length) f.insertAdjacentHTML("beforebegin", `<div class="fhall"><p>A private museum of the things I love most — step into any gallery.</p>${shelves.length > 1 ? `<nav>${links.join("")}</nav>` : ""}</div>`);
    });
    const c = $q("section#collections, div#collections"); if (c) { c.classList.add("museum", "fx-glow"); useF(); }
  }
  let fl = 0; const useF = () => { if (fl) return; fl = 1; const l = D.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@500;600&display=swap"; D.head.appendChild(l); };
  function letters() { $a("section>h2:not([data-fx])").forEach(h => { h.dataset.fx = 1; if (h.children.length || !/^[\x20-\x7E]+$/.test(h.textContent)) return; let k = 0; h.innerHTML = h.textContent.split(" ").map(w => `<span class="fx-lw">${[...w].map(c => `<span class="fx-l" style="--k:${k++}">${esc(c)}</span>`).join("")}</span>`).join(" "); }); }
  function lazy() { $a("img:not([data-fx])").forEach(i => { i.dataset.fx = 1; if (!i.closest(".hero")) { i.loading = i.loading || "lazy"; i.decoding = "async"; } }); $a("video:not([data-fx])").forEach(v => { v.dataset.fx = 1; if ("IntersectionObserver" in window) new IntersectionObserver(e => e[0].isIntersecting ? v.play().catch(() => {}) : v.pause(), { threshold: .05 }).observe(v); }); }
  const par = new Set(); let io2;
  function widgets() {
    $a(".mag .pic img:not([data-p]),.sub .pic img:not([data-p])").forEach(i => { i.dataset.p = 1; i.style.scale = "1.12"; i.parentNode.dataset.par = 1; par.add(i); });
    if (fine) { $a(".museum .ccard:not([data-tilt]),.fav-museum .fk:not([data-tilt])").forEach(e => e.dataset.tilt = 1); $a(".seemore,.gbopen,.rbtn,.nb2,.dm").forEach(e => e.dataset.mag = 1); }
    $a(".mc b:not([data-cu]),.stats b:not([data-cu])").forEach(b => { const n = parseInt(b.firstChild && b.firstChild.nodeValue); if (!isFinite(n)) return; b.dataset.cu = n; if (!io2) io2 = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io2.unobserve(e.target); const t = e.target, N = +t.dataset.cu, T = performance.now(); (function f(now) { const x = Math.min(1, (now - T) / 1100); t.firstChild.nodeValue = Math.round(N * (1 - Math.pow(1 - x, 3))); if (x < 1) requestAnimationFrame(f); })(T); }), { threshold: .6 }); io2.observe(b); });
  }
  let t0; const enhance = () => { clearTimeout(t0); t0 = setTimeout(() => { setupHero(); favourites(); letters(); lazy(); widgets(); }, 90); };
  new MutationObserver(enhance).observe(D.body, { childList: true, subtree: true }); enhance();
  /* make revealed headings trigger the letter animation (reveal() adds .in to the h2) */

  /* 5 · pointer effects: 3D tilt, magnetic pull, spotlight */
  if (fine) {
    D.addEventListener("pointermove", e => {
      const t = e.target.closest && e.target.closest("[data-tilt]"); if (t) { const r = t.getBoundingClientRect(); t.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 9 + "deg"); t.style.setProperty("--rx", (.5 - (e.clientY - r.top) / r.height) * 9 + "deg"); }
      const m = e.target.closest && e.target.closest("[data-mag]"); if (m) { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; }
      const g = e.target.closest && e.target.closest(".fx-glow"); if (g) { const r = g.getBoundingClientRect(); g.style.setProperty("--mx", e.clientX - r.left + "px"); g.style.setProperty("--my", e.clientY - r.top + "px"); g.classList.add("fx-hot"); }
    }, { passive: true });
    D.addEventListener("pointerout", e => { const t = e.target.closest && e.target.closest("[data-tilt]"); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); } const m = e.target.closest && e.target.closest("[data-mag]"); if (m && !m.contains(e.relatedTarget)) m.style.transform = ""; const g = e.target.closest && e.target.closest(".fx-glow"); if (g && !g.contains(e.relatedTarget)) g.classList.remove("fx-hot"); }, { passive: true });
  }

  /* 6 · one rAF-throttled scroll loop: hero split, progress, nav hide/show, image drift */
  let y0 = scrollY, tick = false, lastY = scrollY; const nav = () => $q(".nav");
  function frame() {
    tick = false; const y = scrollY, vh = innerHeight, max = D.documentElement.scrollHeight - vh;
    bar.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);
    if (hero) hero.style.setProperty("--p", Math.min(1, y / (vh * .85)).toFixed(4));
    const n = nav(); if (n) n.classList.toggle("hid", y > lastY + 4 && y > vh * .6 ? true : y < lastY - 4 ? false : n.classList.contains("hid"));
    lastY = y;
    par.forEach(i => { if (!i.isConnected) return par.delete(i); const r = i.parentNode.getBoundingClientRect(); if (r.bottom < -80 || r.top > vh + 80) return; i.style.translate = `0 ${(((r.top + r.height / 2) - vh / 2) / vh * -34).toFixed(1)}px`; });
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true }); addEventListener("resize", frame); frame();
})();
