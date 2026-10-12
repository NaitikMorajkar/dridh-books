// Stage 3 author story source module. It returns full Wikipedia article text for six cards.
const WIKIPEDIA_ACTION_API = 'https://en.wikipedia.org/w/api.php';

async function fetchAuthorArticle(title, sourceLabel) {
  const url = `${WIKIPEDIA_ACTION_API}?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${sourceLabel} HTTP ${response.status}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages || {}).find((item) => !item.missing && item.extract);
  const text = String(page?.extract || '').replace(/\s+/g, ' ').trim();
  console.log('[Dridh Books] author:', title, 'Wikipedia title tried:', page?.title || title, 'text length:', text.length);
  return page && text.length >= 600 ? { title: page.title, text } : null;
}

async function searchAuthorArticle(title) {
  const searchUrl = `${WIKIPEDIA_ACTION_API}?action=query&list=search&srsearch=${encodeURIComponent(title)}&srlimit=5&format=json&origin=*`;
  const response = await fetch(searchUrl);
  if (!response.ok) throw new Error(`Wikipedia author search HTTP ${response.status}`);
  const data = await response.json();
  const candidates = data.query?.search || [];
  for (const candidate of candidates) {
    const article = await fetchAuthorArticle(candidate.title, 'Wikipedia search fallback');
    if (article) return article;
  }
  return null;
}

async function get_author_story(authorTitle) {
  try {
    const exact = await fetchAuthorArticle(authorTitle, 'Wikipedia exact author article');
    if (exact) return exact;
  } catch (error) {
    console.warn('[Dridh Books] exact Wikipedia author lookup failed:', authorTitle, error.message);
  }
  try {
    const fallback = await searchAuthorArticle(authorTitle);
    if (fallback) return fallback;
  } catch (error) {
    console.warn('[Dridh Books] Wikipedia author search fallback failed:', authorTitle, error.message);
  }
  return null;
}

window.get_author_story = get_author_story;
