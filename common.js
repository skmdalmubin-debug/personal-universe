const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"}) : "";
const MAP = {
  travel:       { label: "Travel",       text: "description", cover: "cover_url", order: ["sort_order", "visited_on"],  meta: r => [[r.location, r.country].filter(Boolean).join(", "), fmt(r.visited_on)].filter(Boolean).join(" · ") },
  collections:  { label: "Collection",   text: "description", cover: "image_url", order: ["sort_order", "created_at"], meta: r => r.category || "" },
  journal:      { label: "Journal",      text: "body",        cover: "cover_url", order: ["written_on"],               meta: r => fmt(r.written_on) },
  achievements: { label: "Achievements", text: "description", cover: "image_url", order: ["sort_order", "achieved_on"], meta: r => fmt(r.achieved_on) },
  memories:     { label: "Memories",     text: "description", cover: "image_url", order: ["sort_order", "memory_date"], meta: r => fmt(r.memory_date) }
};
