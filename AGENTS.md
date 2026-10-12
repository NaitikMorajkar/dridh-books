# AGENTS.md

## Architecture
Static multi-page site in `public/` (published directly, see `netlify.toml`; no bundler, no framework). Netlify pretty URLs map `/chat` → `chat.html`, etc. All data (profile, saved books, Sankalp) lives in `localStorage`; book and author data come from public APIs called client-side.

## Key files
- `style.css` — all base styling (minified single file, design tokens in `:root`).
- `profile.js`, `auth.js` — local profile + optional hashed passcode.
- `chat.js`, `books.js`, `authors.js` — assistant, category → book matching, curated author list.
- `story.js`, `author.js` — story room cards, previews, PDF pack.
- `sankalp.js`, `saved.js` — streak tracker and saved shelf.
- `scene.js` (login hero), `fx3d.js` (3D book background, card tilt, Effects switch), `cursor.js` (3D pointer).
- `motion.css` + `motion.js` — the animation layer, included on every page.

## Motion layer conventions
- Every page has an inline `<head>` script that adds `html.m-on` (motion allowed) and `html.m-fast` (intro already seen this session). All motion CSS is gated on `html.m-on`; when the Effects switch is off (`localStorage.dridhLiteMode === 'true'`) or reduced motion is requested, nothing is hidden or animated.
- The page curtain is pure CSS (`body::before/::after`), so it lifts even if JS fails.
- Entrances use the individual `translate` / `scale` / `rotate` properties, not `transform`, so they compose with the tilt transforms from `fx3d.js`. `.m-reveal` classes are removed after the entrance so the page's own transitions take over again.
- `motion.js` never edits the feature scripts; it reacts to their DOM changes with MutationObservers (chat messages, `#book-grid`, `#saved-list`, story cards, `h1[id]`/`h2[id]`). Keep that separation when adding features: new dynamic content can be animated by adding a selector in `motion.js`.
- Headline splitting uses custom inline elements `<m-word>`/`<m-char>` so existing `h1 span` style rules don't match them. Child elements with ids (e.g. `#greeting-name`) are animated as whole units so scripts can keep updating them. Gradient-clipped titles (`.sanctum-header h1`) are not split — use the `m-title` wipe instead.
