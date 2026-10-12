// Stage 2 search module. Kept separate so it can become an MCP tool later.
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json';

function cleanTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function wikipediaAuthorCheck(candidate) {
  const title = encodeURIComponent(candidate.wikipediaTitle);
  const url = `${WIKIPEDIA_API}?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${title}&format=json&origin=*`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const page = pages.find((item) => !item.missing && item.extract);
    const textLength = page?.extract?.length || 0;
    console.log('[Dridh Books] author:', candidate.author, 'Wikipedia title tried:', candidate.wikipediaTitle, 'text length:', textLength);
    return page ? { title: page.title, extract: page.extract, textLength } : null;
  } catch (error) {
    console.warn('[Dridh Books] Wikipedia author check failed:', candidate.author, error.message);
    return null;
  }
}

async function openLibraryMatch(title, author) {
  const query = encodeURIComponent(`title:${title} author:${author}`);
  try {
    const response = await fetch(`${OPEN_LIBRARY_API}?q=${query}&limit=5&fields=title,author_name,cover_i,first_publish_year,key`);
    if (!response.ok) throw new Error(`Open Library HTTP ${response.status}`);
    const data = await response.json();
    const docs = data.docs || [];
    const doc = docs.find((item) => item.cover_i) || docs[0];
    if (!doc) return null;
    console.log('[Dridh Books] book source used: Open Library', 'title:', doc.title);
    return { coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '', openLibraryKey: doc.key || '', published: doc.first_publish_year || '' };
  } catch (error) {
    console.warn('[Dridh Books] Open Library lookup failed:', title, error.message);
    return null;
  }
}

async function openLibraryFallback(category) {
  const query = encodeURIComponent(category);
  try {
    const response = await fetch(`${OPEN_LIBRARY_API}?q=${query}&limit=20&fields=title,author_name,cover_i,key`);
    if (!response.ok) throw new Error(`Open Library fallback HTTP ${response.status}`);
    const data = await response.json();
    return (data.docs || []).filter((doc) => doc.title && doc.author_name?.length).slice(0, 12).map((doc) => ({
      author: doc.author_name[0], wikipediaTitle: doc.author_name[0], book: cleanTitle(doc.title), coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '', openLibraryKey: doc.key || ''
    }));
  } catch (error) {
    console.warn('[Dridh Books] Open Library fallback failed:', error.message);
    return [];
  }
}

async function validateAndEnrich(candidate, category) {
  const wiki = await wikipediaAuthorCheck(candidate);
  if (!wiki || wiki.textLength < 120) return null;
  const library = candidate.coverUrl ? candidate : await openLibraryMatch(candidate.book, candidate.author);
  console.log('[Dridh Books] accepted author:', candidate.author, 'book source used:', library ? 'Open Library' : 'generated placeholder');
  return {
    category,
    title: candidate.book,
    author: candidate.author,
    wikipediaTitle: wiki.title,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title.replace(/ /g, '_'))}`,
    coverUrl: library?.coverUrl || '',
    openLibraryKey: library?.openLibraryKey || '',
    published: library?.published || ''
  };
}

async function search_books(category) {
  const requested = AUTHOR_CATALOG[category] ? category : 'Motivation';
  const curated = AUTHOR_CATALOG[requested] || [];
  const results = [];
  for (const candidate of curated) {
    const enriched = await validateAndEnrich(candidate, requested);
    if (enriched) results.push(enriched);
    if (results.length === 3) break;
  }
  if (results.length < 2) {
    const fallback = await openLibraryFallback(requested);
    for (const candidate of fallback) {
      if (results.some((book) => book.author.toLowerCase() === candidate.author.toLowerCase())) continue;
      const enriched = await validateAndEnrich(candidate, requested);
      if (enriched) results.push(enriched);
      if (results.length === 3) break;
    }
  }
  return results;
}

window.search_books = search_books;
