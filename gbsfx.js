/* gbsfx.js — layered, synthesized guest-book sounds (paper, leather, cloth, pen) + bookmark ribbon.
   To use real recordings instead, drop files in /sfx/ named page.mp3, open.mp3, close.mp3, ribbon.mp3, pen.mp3, stamp.mp3 — they are used automatically when present. */
(() => {
  let A, out, wet, noiseBuf; const rnd = (a, b) => a + Math.random() * (b - a);
  const muted = () => localStorage.getItem("gb-mute") === "1";
  const samples = {}; ["page", "open", "close", "ribbon", "pen", "stamp"].forEach(n => { const a = new Audio("sfx/" + n + ".mp3"); a.preload = "none"; a.addEventListener("canplaythrough", () => samples[n] = a, { once: true }); fetch("sfx/" + n + ".mp3", { method: "HEAD" }).then(r => { if (r.ok && /audio|octet/.test(r.headers.get("content-type") || "")) { a.preload = "auto"; a.load(); } }).catch(() => {}); });
  const play = n => { const a = samples[n]; if (!a) return false; const c = a.cloneNode(); c.volume = .7; c.play().catch(() => {}); return true; };
  function ctx() {
    if (A) return A.state === "suspended" ? (A.resume(), A) : A;
    A = new (window.AudioContext || window.webkitAudioContext)(); const comp = A.createDynamicsCompressor(); out = A.createGain(); out.gain.value = .9; out.connect(comp); comp.connect(A.destination);
    const n = A.sampleRate * 1.1, ir = A.createBuffer(2, n, A.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    const cv = A.createConvolver(); cv.buffer = ir; wet = A.createGain(); wet.gain.value = .16; cv.connect(wet); wet.connect(comp); out.connect(cv);
    noiseBuf = A.createBuffer(1, A.sampleRate * 2, A.sampleRate); const d = noiseBuf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = w * .6 + b * 3.5; }
    return A;
  }
  /* building blocks */
  const noise = (t, dur, f0, f1, q, type, gain, shape) => {
    const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = type || "bandpass"; f.Q.value = q || .8;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const a = shape || [.25, .6]; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * a[0]); g.gain.setTargetAtTime(0, t + dur * a[1], dur * .18);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, rnd(0, 1)); s.stop(t + dur * 1.5); return g;
  };
  const flutter = (t, dur, hz, gain) => { const g = noise(t, dur, 3400, 2600, 2, "bandpass", gain), l = A.createOscillator(), d = A.createGain(); l.frequency.value = hz; d.gain.value = gain * .8; l.connect(d); d.connect(g.gain); l.start(t); l.stop(t + dur * 1.4); };
  const thump = (t, f, gain, dur) => { const o = A.createOscillator(), g = A.createGain(); o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .45, t + dur); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .05); };
  const creak = (t, dur, gain) => { /* leather: resonant band that sweeps with jitter + stick-slip pulses */
    const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(), l = A.createOscillator(), ld = A.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = "bandpass"; f.Q.value = 16;
    for (let i = 0; i <= 12; i++) f.frequency.linearRampToValueAtTime(rnd(300, 520) + i * 22, t + dur * i / 12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * .2); g.gain.setTargetAtTime(0, t + dur * .75, dur * .1);
    l.frequency.value = rnd(16, 26); ld.gain.value = gain * .7; l.connect(ld); ld.connect(g.gain); s.connect(f); f.connect(g); g.connect(out); s.start(t, rnd(0, 1)); l.start(t); s.stop(t + dur * 1.2); l.stop(t + dur * 1.2);
  };
  const run = fn => { if (muted()) return; try { ctx(); fn(A.currentTime + .02); } catch (e) {} };
  const API = {
    page(rev) { if (play("page")) return; run(t => { const k = rnd(.92, 1.08) * (rev ? .88 : 1);
      noise(t, .34, 700 * k, 3000 * k, .7, "bandpass", .22, [.3, .6]); noise(t + .02, .6, 500, 260, .5, "lowpass", .16, [.4, .5]);
      flutter(t + .12, .34, rnd(24, 34), .09); noise(t + .08, .25, 5200, 2400, 1.2, "highpass", .05);
      noise(t + .66, .1, 1400, 700, .6, "lowpass", .22, [.1, .3]); thump(t + .68, 110 * k, .22, .16); }); },
    open() { if (play("open")) return; run(t => { creak(t, 1.0, .1); noise(t + .1, .8, 600, 1800, .6, "bandpass", .12); noise(t + .55, .5, 2600, 3800, .9, "bandpass", .06); thump(t + .95, 70, .24, .25); noise(t + .95, .18, 900, 400, .5, "lowpass", .18, [.1, .3]); }); },
    close() { if (play("close")) return; run(t => { noise(t, .5, 900, 300, .5, "lowpass", .2, [.5, .7]); creak(t + .1, .7, .08); thump(t + .55, 62, .5, .35); noise(t + .55, .22, 700, 250, .5, "lowpass", .3, [.05, .25]); }); },
    ribbon() { if (play("ribbon")) return; run(t => { noise(t, .3, 1800, 5200, 1, "highpass", .1, [.15, .4]); noise(t, .35, 900, 1400, .8, "bandpass", .06); }); },
    pen() { if (play("pen")) return; run(t => { for (let i = 0; i < 6; i++) noise(t + i * .075, .07, rnd(3400, 5200), 2600, 3, "bandpass", .05, [.2, .5]); }); },
    stamp() { if (play("stamp")) return; run(t => { thump(t, 140, .45, .22); noise(t, .12, 1800, 500, .6, "lowpass", .24, [.05, .3]); thump(t + .02, 55, .3, .35); }); },
    key() { const n = Date.now(); if (n - (API._k || 0) < 70) return; API._k = n; run(t => { noise(t, .04, rnd(3000, 4800), 2400, 4, "bandpass", .035, [.1, .4]); }); },
    /* ribbon + sound toggle, redrawn with every page */
    dress(el, i, n, go) {
      if (!el || !el.classList.contains("book")) return; const mk = +localStorage.getItem("gb-mark"), has = localStorage.getItem("gb-mark") !== null && mk < n;
      el.querySelectorAll(".gbrib,.gbsnd").forEach(x => x.remove());
      const r = document.createElement("button"); r.type = "button"; r.className = "gbrib" + (has && mk === i ? " set" : ""); r.title = has && mk !== i ? "Jump to your bookmark" : "Bookmark this page"; r.setAttribute("aria-label", r.title);
      r.onclick = () => { API.ribbon(); if (has && mk !== i) go(mk); else if (i >= 0) { has && mk === i ? localStorage.removeItem("gb-mark") : localStorage.setItem("gb-mark", i); r.classList.toggle("set"); } };
      const s = document.createElement("button"); s.type = "button"; s.className = "gbsnd"; s.textContent = muted() ? "🔇" : "🔊"; s.title = "Sound on/off";
      s.onclick = () => { localStorage.setItem("gb-mute", muted() ? "0" : "1"); s.textContent = muted() ? "🔇" : "🔊"; API.ribbon(); };
      el.append(r, s);
    }
  };
  document.addEventListener("keydown", e => { if (e.target.closest && e.target.closest(".gbpage") && /INPUT|TEXTAREA/.test(e.target.tagName)) API.key(); }, true);
  window.GBSFX = API;
})();
