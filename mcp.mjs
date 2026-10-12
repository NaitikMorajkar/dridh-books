// Dridh Books MCP server (Streamable HTTP, stateless, JSON responses).
// Endpoint: /mcp  (Netlify Function, no secrets, no API keys).
// Tools: list_categories, search_books, get_author_story.
// Data comes live from Wikipedia. The curated author list lives in catalog.mjs.
import { CATALOG } from './catalog.mjs';

const SERVER_INFO = { name: 'dridh-books', title: 'Dridh Books', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const UA = 'DridhBooks-MCP/1.0 (student hackathon demo; https://dridh-books.netlify.app/)';
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id'
};

const TOOLS = [
  {
    name: 'list_categories',
    title: 'List book categories',
    description: 'List the reading categories Dridh Books can suggest books for (for example Motivation, Exam stress, Physics).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: 'search_books',
    title: 'Search books by category',
    description: 'Suggest 1 to 5 books for a category. Each suggested author is checked against Wikipedia so a story can be told about them. Use this when a student says what they want to read or how they feel.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'One of: Motivation, Exam stress, Physics, Maths, Career, Biography (case-insensitive). Call list_categories to see all.' },
        limit: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'How many books to return (1 to 5).' }
      },
      required: ['category'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  {
    name: 'get_author_story',
    title: 'Get an author\'s story',
    description: 'Fetch the Wikipedia article text about an author so a short story (who they are, how they started, the biggest struggle, the turning point, the lesson) can be told. Returns source text and a link. Nothing is invented.',
    inputSchema: {
      type: 'object',
      properties: {
        author: { type: 'string', description: 'Author name, for example "A. P. J. Abdul Kalam".' }
      },
      required: ['author'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  }
];

// ---------- helpers ----------
async function getJson(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

function normalise(text) { return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

function findCategory(input) {
  const wanted = normalise(input);
  return Object.keys(CATALOG).find((name) => normalise(name) === wanted) || null;
}

async function hasUsableSummary(title) {
  try {
    const data = await getJson(WIKI_REST + encodeURIComponent(title.replace(/ /g, '_')) + '?redirect=true');
    return typeof data.extract === 'string' && data.extract.length >= 120;
  } catch { return false; }
}

async function fetchArticle(title) {
  const params = new URLSearchParams({ action: 'query', prop: 'extracts|info', explaintext: '1', redirects: '1', inprop: 'url', titles: title, format: 'json', formatversion: '2' });
  const data = await getJson(`${WIKI_API}?${params}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.extract) return null;
  return { title: page.title, url: page.fullurl, text: page.extract };
}

async function searchTitle(name) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: name, srlimit: '1', format: 'json', formatversion: '2' });
  const data = await getJson(`${WIKI_API}?${params}`);
  return data?.query?.search?.[0]?.title || null;
}

// ---------- tool implementations ----------
async function listCategories() {
  return { categories: Object.keys(CATALOG) };
}

async function searchBooks(args) {
  const category = findCategory(args.category);
  if (!category) {
    const error = new Error(`Unknown category "${String(args.category).slice(0, 40)}". Available: ${Object.keys(CATALOG).join(', ')}.`);
    error.userFacing = true;
    throw error;
  }
  const limit = Number.isInteger(args.limit) ? Math.min(5, Math.max(1, args.limit)) : 3;
  // Shuffle so repeat calls give variety, then keep only books whose author has a usable Wikipedia page.
  const pool = [...CATALOG[category]].sort(() => Math.random() - 0.5);
  const books = [];
  for (let i = 0; i < pool.length && books.length < limit; i += limit) {
    const batch = pool.slice(i, i + limit);
    const checks = await Promise.all(batch.map((item) => hasUsableSummary(item.wikipediaTitle)));
    batch.forEach((item, index) => {
      if (checks[index] && books.length < limit) {
        books.push({ title: item.book, author: item.author, wikipediaTitle: item.wikipediaTitle, category });
      }
    });
  }
  return { category, count: books.length, books, note: books.length ? 'Authors were checked against Wikipedia.' : 'No author passed the Wikipedia check right now. Try again or pick another category.' };
}

async function getAuthorStory(args) {
  const name = String(args.author || '').trim().slice(0, 120);
  if (!name) { const e = new Error('Please give an author name.'); e.userFacing = true; throw e; }
  let article = await fetchArticle(name);
  if (!article || article.text.length < 600) {
    const found = await searchTitle(name);
    if (found) article = await fetchArticle(found);
  }
  if (!article || article.text.length < 600) {
    const e = new Error(`Not enough reliable Wikipedia text was found for "${name}". Try another author.`);
    e.userFacing = true;
    throw e;
  }
  return {
    author: name,
    wikipediaTitle: article.title,
    sourceUrl: article.url,
    license: 'Text from Wikipedia, CC BY-SA 4.0',
    articleText: article.text.slice(0, 4000),
    instructions: 'Write the story in your own words using only this text. Do not invent facts.'
  };
}

const IMPLEMENTATIONS = { list_categories: listCategories, search_books: searchBooks, get_author_story: getAuthorStory };

// ---------- JSON-RPC ----------
const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function handleMessage(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return fail(message && message.id !== undefined ? message.id : null, -32600, 'Invalid Request');
  }
  const isNotification = message.id === undefined || message.id === null;
  const { id, method, params } = message;
  if (isNotification) return null; // notifications (like notifications/initialized) get no reply

  switch (method) {
    case 'initialize': {
      const asked = params && params.protocolVersion;
      const version = SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0];
      return ok(id, {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Dridh Books helps busy students. Use search_books to suggest books for a category, then get_author_story for the author. Write stories in your own words from the returned text only.'
      });
    }
    case 'ping': return ok(id, {});
    case 'tools/list': return ok(id, { tools: TOOLS });
    case 'tools/call': {
      const name = params && params.name;
      const impl = IMPLEMENTATIONS[name];
      if (!impl) return fail(id, -32602, `Unknown tool: ${String(name).slice(0, 60)}`);
      try {
        const result = await impl((params && params.arguments) || {});
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false });
      } catch (error) {
        const text = error && error.userFacing ? error.message : 'The data source is not answering right now. Please try again.';
        return ok(id, { content: [{ type: 'text', text }], isError: true });
      }
    }
    default: return fail(id, -32601, `Method not found: ${method.slice(0, 60)}`);
  }
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method === 'GET') {
    return new Response('Dridh Books MCP server. Send JSON-RPC with POST to this URL (Streamable HTTP).', { status: 405, headers: { Allow: 'POST, OPTIONS', 'Content-Type': 'text/plain', ...CORS } });
  }
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST, OPTIONS', ...CORS } });

  let body;
  try { body = JSON.parse(await request.text()); } catch { return json(fail(null, -32700, 'Parse error'), 400); }

  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(handleMessage))).filter(Boolean);
    return replies.length ? json(replies) : new Response(null, { status: 202, headers: CORS });
  }
  const reply = await handleMessage(body);
  return reply ? json(reply) : new Response(null, { status: 202, headers: CORS });
};

export const config = { path: '/mcp' };
