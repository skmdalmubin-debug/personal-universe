/* Personal Universe — Companies renderer v2
   IMPORTANT: include this script AFTER the existing inline homepage script. */
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  const findTarget = () =>
    document.getElementById("c-companies") ||
    document.querySelector('#companies [id^="c-"]') ||
    document.querySelector("#companies");

  async function waitForTarget() {
    for (let i = 0; i < 300; i++) {
      const target = findTarget();
      if (target && typeof sb !== "undefined") return target;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  async function loadCompanies() {
    const root = await waitForTarget();
    if (!root) {
      console.error("[Companies] Could not find the homepage Companies container.");
      return;
    }

    root.innerHTML = '<p class="empty">Loading companies…</p>';

    // Avoid ordering by optional columns: fetch all published rows first.
    const { data, error } = await sb
      .from("companies")
      .select("*")
      .eq("published", true);

    if (error) {
      console.error("[Companies] Supabase query failed:", error);
      root.innerHTML = '<p class="empty">Unable to load companies. Please check the Supabase companies table permissions.</p>';
      return;
    }

    const rows = (data || []).sort((a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
    );

    if (!rows.length) {
      root.innerHTML = '<p class="empty">No published companies found.</p>';
      return;
    }

    if (!document.getElementById("companies-v2-style")) {
      const style = document.createElement("style");
      style.id = "companies-v2-style";
      style.textContent = `
        #c-companies .co2-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:22px}
        #c-companies .co2-card{--co2-accent:#b8924a;display:flex;flex-direction:column;min-height:390px;overflow:hidden;border:1px solid color-mix(in srgb,var(--co2-accent) 45%,transparent);border-radius:20px;background:#151515;color:#f5f1e9;text-align:left;cursor:pointer;padding:0;transition:transform .25s,border-color .25s}
        #c-companies .co2-card:hover{transform:translateY(-5px);border-color:var(--co2-accent)}
        #c-companies .co2-cover{width:100%;height:210px;object-fit:cover;background:#252525}
        #c-companies .co2-body{display:flex;flex:1;flex-direction:column;align-items:flex-start;padding:22px}
        #c-companies .co2-logo{width:60px;height:60px;object-fit:cover;border-radius:50%;margin-top:-50px;margin-bottom:14px;border:1px solid var(--co2-accent);background:#222;position:relative}
        #c-companies .co2-placeholder{display:grid;place-items:center;width:60px;height:60px;margin-top:-50px;margin-bottom:14px;border:1px solid var(--co2-accent);border-radius:50%;background:#222;color:var(--co2-accent);font:600 25px Georgia;position:relative}
        #c-companies .co2-industry{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--co2-accent)}
        #c-companies .co2-card h3{font-size:25px;line-height:1.2;margin:8px 0}
        #c-companies .co2-intro{font-size:14px;line-height:1.7;opacity:.8;margin:0 0 18px}
        #c-companies .co2-open{margin-top:auto;color:var(--co2-accent);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
        .co2-modal{display:none;position:fixed;inset:0;z-index:999999;overflow:auto;padding:18px;background:rgba(0,0,0,.82);backdrop-filter:blur(9px)}
        .co2-modal.open{display:block}
        .co2-inner{max-width:920px;margin:24px auto;border:1px solid #4b463d;border-radius:20px;overflow:hidden;background:#111;color:#eee}
        .co2-cover{display:block;width:100%;max-height:390px;object-fit:cover;background:#222}
        .co2-content{padding:clamp(22px,5vw,48px)}
        .co2-close{float:right;position:sticky;top:10px;z-index:2;margin:10px 10px -54px 0;width:42px;height:42px;border:1px solid #777;border-radius:50%;background:#111;color:white;font-size:25px;cursor:pointer}
        .co2-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--co2-accent,#c5a46a)}
        .co2-content h2{font-size:clamp(30px,5vw,48px);margin:10px 0 12px}
        .co2-lead{font-size:17px;line-height:1.7;color:#c9c4ba}
        .co2-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin-top:28px}
        .co2-field{border-top:1px solid #393630;padding-top:15px}
        .co2-field h4{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--co2-accent,#c5a46a);margin:0 0 9px}
        .co2-field p{font-size:14px;line-height:1.8;color:#ddd;margin:0;overflow-wrap:anywhere;white-space:pre-wrap}
        .co2-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:24px}
        .co2-gallery img{width:100%;height:180px;object-fit:cover;border-radius:10px}
        .co2-link{display:inline-block;margin-top:24px;color:var(--co2-accent,#c5a46a);overflow-wrap:anywhere}
        @media(max-width:600px){.co2-modal{padding:8px}.co2-inner{margin:8px auto}}
      `;
      document.head.appendChild(style);
    }

    let modal = document.getElementById("co2-company-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "co2-company-modal";
      modal.className = "co2-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML = '<div class="co2-inner"><button class="co2-close" type="button" aria-label="Close">×</button><div class="co2-modal-body"></div></div>';
      document.body.appendChild(modal);
      const close = () => {
        modal.classList.remove("open");
        document.body.style.overflow = "";
      };
      modal.querySelector(".co2-close").addEventListener("click", close);
      modal.addEventListener("click", e => { if (e.target === modal) close(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }

    const fields = [
      ["About", "about"], ["Vision", "vision"], ["Mission", "mission"],
      ["Values", "values_text"], ["Products & Services", "products_text"],
      ["Business Model", "model_text"], ["Market", "market_text"],
      ["Market Information", "market_stats"], ["Leadership", "leaders_text"],
      ["Ownership", "ownership_text"], ["Milestones", "milestones_text"],
      ["Future Direction", "future_text"], ["Additional Links", "links_text"],
      ["Founded", "founded"], ["Location", "location"], ["Address", "address"],
      ["Email", "email"], ["Phone", "phone"]
    ];

    function openCompany(company) {
      const accent = /^#[0-9a-f]{6}$/i.test(company.accent || "") ? company.accent : "#b8924a";
      modal.style.setProperty("--co2-accent", accent);
      const details = fields.map(([label, key]) => company[key]
        ? `<section class="co2-field"><h4>${esc(label)}</h4><p>${esc(company[key])}</p></section>` : ""
      ).join("");
      const gallery = Array.isArray(company.images)
        ? company.images.filter(x => x && x.url && x.type !== "video")
          .map(x => `<img src="${esc(x.url)}" alt="${esc(x.caption || company.name)}" loading="lazy">`).join("")
        : "";
      const cover = company.cover_url ? `<img class="co2-cover" src="${esc(company.cover_url)}" alt="">` : "";
      const website = company.website
        ? `<a class="co2-link" href="${esc(company.website)}" target="_blank" rel="noopener noreferrer">Visit official website ↗</a>` : "";
      modal.querySelector(".co2-modal-body").innerHTML = `
        ${cover}<div class="co2-content">
          <div class="co2-kicker">${esc(company.industry || "Company")}</div>
          <h2>${esc(company.name || "Company")}</h2>
          ${company.intro ? `<p class="co2-lead">${esc(company.intro)}</p>` : ""}
          ${details ? `<div class="co2-details">${details}</div>` : ""}
          ${gallery ? `<div class="co2-gallery">${gallery}</div>` : ""}
          ${website}
        </div>`;
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      modal.scrollTop = 0;
    }

    root.innerHTML = `<div class="co2-grid">${rows.map((company, i) => {
      const accent = /^#[0-9a-f]{6}$/i.test(company.accent || "") ? company.accent : "#b8924a";
      const logo = company.logo_url
        ? `<img class="co2-logo" src="${esc(company.logo_url)}" alt="">`
        : `<div class="co2-placeholder">${esc((company.name || "C").slice(0,1).toUpperCase())}</div>`;
      const cover = company.cover_url
        ? `<img class="co2-cover" src="${esc(company.cover_url)}" alt="" loading="lazy">`
        : '<div class="co2-cover"></div>';
      return `<button class="co2-card" type="button" data-co2-index="${i}" style="--co2-accent:${accent}">
        ${cover}<div class="co2-body">${logo}
          <div class="co2-industry">${esc(company.industry || "Company")}</div>
          <h3>${esc(company.name || "Untitled company")}</h3>
          ${company.intro ? `<p class="co2-intro">${esc(company.intro)}</p>` : ""}
          <span class="co2-open">Explore company ↗</span>
        </div></button>`;
    }).join("")}</div>`;

    root.querySelectorAll("[data-co2-index]").forEach(button => {
      button.addEventListener("click", () => openCompany(rows[Number(button.dataset.co2Index)]));
    });
    console.info(`[Companies] Rendered ${rows.length} published company records.`);
  }

  loadCompanies().catch(error => {
    console.error("[Companies] Unexpected error:", error);
  });
})();
