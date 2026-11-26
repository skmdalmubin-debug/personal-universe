PERSONAL UNIVERSE — UPGRADE PACKAGE
====================================
Upload EVERYTHING in this folder to the root of your GitHub repo (replace existing files), commit, wait for the
Cloudflare deploy, then hard-refresh. No database changes are needed.

NEW FILES        fx.css, fx.js          cinematic motion, museum Collection/Favourites, companies cards, back button
                 gbsfx.js               guest-book sounds + bookmark ribbon
                 editor.js              Atomic Element Editor (open any page with ?edit=1 while signed in to panel.html)
                 panel-plus.css/.js     redesigned admin panel
CHANGED FILES    index.html, section.html, detail.html, about.html, companies.html, 404.html, panel.html, common.js, config.js
REMOVED          "(1)/(2)" duplicate copies, companies-fix*.js (index.html already loads companies itself), README-UPLOAD.txt

OPTIONS
 • Hero "name slides behind you": uncomment window.HERO_FG_URL in config.js and give it a transparent cut-out of you.
 • Real guest-book sounds: add /sfx/page.mp3, open.mp3, close.mp3, ribbon.mp3, pen.mp3, stamp.mp3 (used automatically).
 • Turn motion off for testing: add ?fx=off to any URL. prefers-reduced-motion is always respected.
