PERSONAL UNIVERSE — COMPANIES SECTION FIX

Your existing repository already contains these four core files:
- panel.html
- detail.html
- common.js
- style.css

Do not replace those four files with a new template. They contain your existing admin panel, data loading, detail-page behavior and design.

1. Upload companies-fix.js to the root of the repository.
2. Open index.html.
3. Find:
   <script src="config.js?v=4"></script><script src="common.js?v=4"></script>
4. Replace it with:
   <script src="config.js?v=4"></script><script src="common.js?v=4"></script>
   <script src="companies-fix.js?v=1"></script>
5. Save and commit index.html.

The script waits for the homepage's Companies section to be created, then fetches
published rows from public.companies and renders company cards with a detail modal.

It reads existing columns only and does not write to Supabase.

IMPORTANT:
- Keep config.js unchanged; it contains the public Supabase project URL/key used by the site.
- The database currently has two published company rows.
- One row has detailed content; the second row is mostly empty, so its profile will
  naturally show only the fields that have been filled in.
