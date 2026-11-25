PERSONAL UNIVERSE — WEBSITE UPDATE PACKAGE

Replace these files in the ROOT of your GitHub repository:
- index.html
- common.js
- style.css
- panel.html
- companies.html
- section.html
- detail.html
- about.html

What is included:
1. Editorial/cinematic hero redesign, staggered reveal and animated “Scroll to explore” cue.
2. Coordinated scroll-reveal motion, including Memories.
3. Museum-catalogue layout for Collection and museum-style Favourites shelves.
4. A rebuilt admin Control Centre with visitor/content metrics and quick actions.
5. A new section-creation option to copy layout and text styling from an existing section.
6. Expanded Companies editor: structured sub-sections with titles, descriptions, images and videos; these now render on company pages.
7. Performance improvement: auto-scrolling strips pause when off-screen or the tab is hidden, and respect reduced-motion preferences.
8. Guestbook: the existing leather cover and page-turn animation are retained. The ribbon is restored on the cover, and opening/closing sounds are added; the page-turn sound remains.

IMPORTANT:
- This package contains changed files only. Keep all other repository files as they are.
- Do not upload the ZIP as a single file to the repository. Extract it, then upload/replace each listed file at the repository root.
- The Companies sub-section editor uses the existing public.companies.subs JSONB column. No database, RLS, credentials, DNS, or Cloudflare settings are changed by this package.
- No GitHub operations were performed by the assistant. Review the changes and make your own commit.
- The update uses cache version v6 for the shared site CSS/JavaScript. The admin panel has its own embedded styles and scripts.

Suggested commit message:
“Redesign personal site and admin experience”
