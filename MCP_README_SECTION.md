## MCP server (Streamable HTTP)

Dridh Books also exposes its book tools through a small, real MCP server so
any MCP client (an assistant or the MCP Inspector) can call them.

- Endpoint: `https://dridh-books.netlify.app/mcp` (Streamable HTTP, stateless,
  JSON responses, no API keys)
- Code: `netlify/functions/mcp.mjs` (server) and `netlify/functions/catalog.mjs`
  (curated author list)
- Tools:
  - `list_categories`: the reading categories
  - `search_books`: suggests 1-5 books for a category; each author is checked
    against Wikipedia
  - `get_author_story`: returns the author's Wikipedia text (with source link
    and licence) so a short story can be written without inventing facts

Quick test (PowerShell):

    $body = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
    Invoke-RestMethod -Uri https://dridh-books.netlify.app/mcp -Method Post -ContentType "application/json" -Body $body

Or run `npx @modelcontextprotocol/inspector`, choose "Streamable HTTP", and
enter the endpoint URL.

The web app calls the same public sources (Wikipedia, Open Library, Google
Books) directly from the browser; the MCP server is a separate way to reach
the same book and author tools.
