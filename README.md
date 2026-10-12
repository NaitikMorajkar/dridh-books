# Dridh Books

One minute. One story. One step stronger. Dridh Books is a reading companion for busy students: a voice/text assistant suggests verified books by mood or subject, each book opens a 60-second author story, and *Sankalp* tracks one small daily step. Profiles, saved books and streaks stay in the browser.

This version adds a full motion layer on top of the existing 3D scene: a branded page intro and page-to-page wipes, letter-by-letter headlines, staggered scroll reveals, word-streamed assistant replies, cards dealt in 3D, story cards that flip forward and back, magnetic buttons, click shockwaves, confetti on wins, parallax nebulae and a scroll progress bar.

## Technology

- Plain HTML, CSS and JavaScript — no build step
- Three.js (CDN) for the floating 3D books and hero scene
- Public APIs called from the browser: Open Library, Wikipedia, Google Books, Gutendex
- Netlify for hosting (`public/` is published as-is)

## Run locally

```bash
netlify dev
# or any static server, e.g.
npx serve public
```

## Pages

| Page | File |
| --- | --- |
| Login / reading alias | `public/index.html` |
| Voice assistant + book shelf | `public/chat.html` |
| Story room | `public/story.html` |
| Sankalp daily streak | `public/sankalp.html` |
| Saved books | `public/saved.html` |

The **✨ Effects** switch (bottom corner) turns all 3D and motion off; motion is also skipped for visitors who prefer reduced motion.
Deploy Link-https://dridh-books.netlify.app/
