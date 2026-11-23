/* Companies & Ventures renderer.
   Include this file in index.html after common.js.
   Uses the existing Supabase client and the existing public.companies table. */
(() => {
  const escHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  const block = (label, value) => value
    ? `<section class="company-detail-block"><h3>${escHTML(label)}</h3><p>${escHTML(value).replace(/\n/g, "<br>")}</p></section>`
    : "";

  async function waitForSection() {
    for (let attempt = 0; attempt < 150; attempt++) {
      const el = document.getElementById("c-companies");
      if (el && typeof sb !== "undefined") return el;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  async function initCompanies() {
    const root = await waitForSection();
    if (!root) return;

    root.innerHTML = '<p class="empty">Loading companies…</p>';

    const { data, error } = await sb.from("companies")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Companies query failed:", error);
      root.innerHTML = '<p class="empty">Companies are temporarily unavailable.</p>';
      return;
    }

    const companies = data || [];
    if (!companies.length) {
      root.innerHTML = '<p class="empty">No published companies yet.</p>';
      return;
    }

    const css = document.createElement("style");
    css.textContent = `
      #c-companies .company-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:22px}
      #c-companies .company-card{--accent:#b8924a;display:flex;flex-direction:column;overflow:hidden;min-height:390px;padding:0;text-align:left;border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);border-radius:22px;background:#151515;color:#f4f0e8;cursor:pointer;transition:transform .25s,border-color .25s}
      #c-companies .company-card:hover{transform:translateY(-5px);border-color:var(--accent)}
      #c-companies .company-cover{width:100%;height:205px;object-fit:cover;background:#252525}
      #c-companies .company-card-content{display:flex;flex:1;flex-direction:column;align-items:flex-start;padding:22px}
      #c-companies .company-logo{width:62px;height:62px;object-fit:cover;border-radius:50%;margin-top:-52px;margin-bottom:14px;border:1px solid var(--accent);background:#222;position:relative}
      #c-companies .company-logo-placeholder{display:grid;place-items:center;width:62px;height:62px;margin-top:-52px;margin-bottom:14px;border:1px solid var(--accent);border-radius:50%;background:#222;color:var(--accent);font:600 25px Georgia;position:relative}
      #c-companies .company-industry{color:var(--accent);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
      #c-companies .company-card h3{font-size:25px;line-height:1.2;margin:8px 0}
      #c-companies .company-intro{font-size:14px;line-height:1.7;opacity:.8;margin:0 0 18px}
      #c-companies .company-open{margin-top:auto;color:var(--accent);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
      .company-modal{display:none;position:fixed;inset:0;z-index:99999;overflow:auto;padding:20px;background:rgba(0,0,0,.8);backdrop-filter:blur(9px)}
      .company-modal.open{display:block}
      .company-modal-inner{max-width:920px;margin:24px auto;border:1px solid #4b463d;border-radius:20px;overflow:hidden;background:#111;color:#eee}
      .company-modal-cover{display:block;width:100%;max-height:390px;object-fit:cover;background:#222}
      .company-modal-content{padding:clamp(22px,5vw,48px)}
      .company-modal-close{position:sticky;float:right;top:10px;z-index:2;margin:10px 10px -54px 0;width:42px;height:42px;border:1px solid #777;border-radius:50%;background:#111;color:white;font-size:25px;cursor:pointer}
      .company-modal-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent,#c5a46a)}
      .company-modal h2{font-size:clamp(30px,5vw,48px);margin:10px 0 12px}
      .company-modal-lead{font-size:17px;line-height:1.7;color:#c9c4ba}
      .company-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin-top:28px}
      .company-detail-block{border-top:1px solid #393630;padding-top:15px}
      .company-detail-block h3{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#c5a46a);margin:0 0 9px}
      .company-detail-block p{font-size:14px;line-height:1.8;color:#ddd;margin:0;overflow-wrap:anywhere}
      .company-modal-link{display:inline-block;margin-top:24px;color:var(--accent,#c5a46a);overflow-wrap:anywhere}
      .company-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:24px}
      .company-gallery img{width:100%;height:180px;object-fit:cover;border-radius:10px}
      @media(max-width:600px){.company-modal{padding:10px}.company-modal-inner{margin:10px auto}}
    `;
    document.head.appendChild(css);

    const modal = document.createElement("div");
    modal.className = "company-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Company details");
    modal.innerHTML = '<div class="company-modal-inner"><button class="company-modal-close" type="button" aria-label="Close">×</button><div class="company-modal-body"></div></div>';
    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    };
    modal.querySelector(".company-modal-close").addEventListener("click", close);
    modal.addEventListener("click", event => { if (event.target === modal) close(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });

    function openCompany(company) {
      const accent = /^#[0-9a-f]{6}$/i.test(company.accent || "") ? company.accent : "#b8924a";
      modal.style.setProperty("--accent", accent);
      const cover = company.cover_url
        ? `<img class="company-modal-cover" src="${escHTML(company.cover_url)}" alt="">` : "";
      const fields = [
        block("About", company.about),
        block("Vision", company.vision),
        block("Mission", company.mission),
        block("Values", company.values_text),
        block("Products & Services", company.products_text),
        block("Business Model", company.model_text),
        block("Market", company.market_text),
        block("Market Information", company.market_stats),
        block("Leadership", company.leaders_text),
        block("Ownership", company.ownership_text),
        block("Milestones", company.milestones_text),
        block("Future Direction", company.future_text),
        block("Additional Links", company.links_text),
        block("Founded", company.founded),
        block("Location", company.location),
        block("Address", company.address),
        block("Email", company.email),
        block("Phone", company.phone)
      ].join("");
      const gallery = Array.isArray(company.images)
        ? company.images.filter(item => item && item.url && item.type !== "video")
            .map(item => `<img src="${escHTML(item.url)}" alt="${escHTML(item.caption || company.name)}" loading="lazy">`).join("")
        : "";
      const website = company.website
        ? `<a class="company-modal-link" href="${escHTML(company.website)}" target="_blank" rel="noopener noreferrer">Visit official website ↗</a>` : "";
      modal.querySelector(".company-modal-body").innerHTML = `
        ${cover}<div class="company-modal-content">
          <div class="company-modal-kicker">${escHTML(company.industry || "Company")}</div>
          <h2>${escHTML(company.name)}</h2>
          ${company.intro ? `<p class="company-modal-lead">${escHTML(company.intro)}</p>` : ""}
          ${fields ? `<div class="company-detail-grid">${fields}</div>` : ""}
          ${gallery ? `<div class="company-gallery">${gallery}</div>` : ""}
          ${website}
        </div>`;
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      modal.scrollTop = 0;
    }

    root.innerHTML = `<div class="company-grid">${companies.map((company, index) => {
      const accent = /^#[0-9a-f]{6}$/i.test(company.accent || "") ? company.accent : "#b8924a";
      const logo = company.logo_url
        ? `<img class="company-logo" src="${escHTML(company.logo_url)}" alt="">`
        : `<div class="company-logo-placeholder">${escHTML((company.name || "C").slice(0,1).toUpperCase())}</div>`;
      const cover = company.cover_url
        ? `<img class="company-cover" src="${escHTML(company.cover_url)}" alt="" loading="lazy">`
        : '<div class="company-cover"></div>';
      return `<button class="company-card" type="button" data-company="${index}" style="--accent:${accent}">
        ${cover}<div class="company-card-content">${logo}
          <div class="company-industry">${escHTML(company.industry || "Company")}</div>
          <h3>${escHTML(company.name)}</h3>
          ${company.intro ? `<p class="company-intro">${escHTML(company.intro)}</p>` : ""}
          <span class="company-open">Explore company ↗</span>
        </div>
      </button>`;
    }).join("")}</div>`;

    root.querySelectorAll("[data-company]").forEach(button => {
      button.addEventListener("click", () => openCompany(companies[Number(button.dataset.company)]));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCompanies, { once: true });
  } else {
    initCompanies();
  }
})();
