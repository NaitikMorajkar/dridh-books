# Dridh Books

One minute. One story. One step stronger.

Dridh Books is a voice and text reading assistant for busy students. A
student picks a category or says how they feel ("I am scared of my
exam"). The assistant suggests books (each author is checked against
Wikipedia), then shows a 60-second author story and a book story as
flashcards. Sankalp tracks one small daily step with a streak, and a
downloadable "story pack" PDF is made for every book.

Live demo: https://dridh-books.netlify.app/

## Hackathon track: Alexa+ (simulated experience)

This project is a simulated Alexa+-style voice assistant built as a web
app, which the Alexa+ track allows. It does not use an Alexa device or an
MCP server. The assistant maps what you say to a category with keyword
matching; it is not a language model. The book search and author story
code are separate modules (`books.js`, `author.js`), so they could later
become tools for a real assistant.

## Features

- Voice (Web Speech API, Chrome) and text chat, with spoken replies
- Books by category, authors checked against Wikipedia
- Author and book flashcards; legal reading links (free downloads only for
  public-domain books, plus borrow, library and buy links)
- Story pack PDF generated in the browser
- Sankalp daily goal, tick, meter and streak; saved books
- 3D floating books, pointer effects and card tilt, with an Effects on/off
  switch (Lite mode)
- Login: nickname and optional passcode, or guest. Data stays in the
  browser; the passcode is stored only as a one-way hash. This is
  demo-level protection, not a real account system.

## Data sources

Wikipedia, Open Library, Google Books, Project Gutenberg (Gutendex) and the
Internet Archive. No API keys are used.

## Run locally

    npx serve public

## Known limits

Data is stored in the browser only. Some authors have short Wikipedia
pages and are skipped. Not every book has a description or preview.

## License

MIT
