PERSONAL UNIVERSE — COMPANIES SECTION FIX

Upload these six files to the ROOT of your GitHub repository (personal-universe):
- index.html
- common.js
- style.css
- panel.html
- detail.html
- companies.html

IMPORTANT:
1. Replace the existing five files with the matching files in this package.
2. Add companies.html as a new root-level file.
3. Commit all six files to the main branch.
4. Wait for Cloudflare Worker deployment to finish.
5. Open the homepage in a private tab or hard-refresh it.

What changed:
- common.js now registers the companies section in the site's section map.
- index.html now explicitly fetches published rows from the Supabase `companies` table and displays them as company cards.
- Company cards link to companies.html, which contains the full company profile experience already present in the supplied repository.
- style.css retains the site's existing visual system and includes responsive company-card refinements.
- panel.html and detail.html are preserved from your supplied source, with cache versions updated.

No database rows, RLS policies, credentials, DNS settings, or Cloudflare settings were changed.
