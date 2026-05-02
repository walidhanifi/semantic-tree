# Heading Audit

Heading Audit is a small TypeScript utility for inspecting the heading structure of any static HTML page. It can be used as a CLI tool or as a lightweight HTTP service to surface three things in one pass:

- the semantic heading outline inferred from `h1` to `h6`
- skipped heading levels such as `h2` to `h4`
- headings whose rank conflicts with their structural nesting in the page

This is useful for accessibility reviews, content QA, SEO checks, CMS migrations, and HTML normalization pipelines.

## Status

The project is stable for static HTML pages and is being expanded toward broader auditing and better packaging. The current roadmap lives in [TODO.md](./TODO.md).

## Quick Start

```bash
npm install
npm run build
```

Run the CLI against a page:

```bash
node dist/cli.js https://www.bbc.com
```

Run the HTTP API locally:

```bash
npm start
```

Then request:

```text
http://localhost:8000?u=https://www.bbc.com
```

Run the test suite:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

Tested on Node 22.

## Response Shape

The tool returns JSON with three top-level keys:

```json
{
  "semantic-structure": [
    {
      "tag": "h1",
      "content": "Heading 1",
      "children": [
        {
          "tag": "h2",
          "content": "Heading 2"
        }
      ]
    }
  ],
  "skipped-levels": [
    [
      { "tag": "h2", "content": "Section title" },
      { "tag": "h4", "content": "Nested title" }
    ]
  ],
  "incongruent-headings": [
    { "tag": "h2", "content": "Out-of-place heading" }
  ]
}
```

## How It Works

1. The HTML is fetched and parsed with `cheerio`.
2. Headings are collected in document order with their text content and structural depth.
3. A stack-based pass builds the semantic heading tree and records skipped levels.
4. A second pass compares heading rank against container depth to flag incongruent headings.

The parsing logic is isolated from the transport layer, so the same core functions power both the CLI and the HTTP endpoint.

## Complexity

- Heading extraction: `O(n x d)` where `n` is the number of headings and `d` is the maximum structural depth walked through parent containers
- Semantic tree construction: `O(n)` amortized
- Incongruence detection: `O(n)`

Overall complexity is `O(n x d)`.

## Project Structure

- `src/index.ts`: parsing, semantic tree construction, incongruence detection
- `src/fetch.ts`: URL validation and HTML fetching
- `src/cli.ts`: command-line entrypoint
- `src/server.ts`: Express server entrypoint
- `src/*.test.ts`: unit and integration coverage

## Current Limitations

- The fetch layer expects static HTML and does not execute client-side JavaScript
- Structural nesting is inferred from `section`, `article`, `nav`, `aside`, and `div`
- The service currently audits one URL at a time with no persistence or caching

For JavaScript-rendered pages, the next practical step is to swap the fetch/extraction layer to a headless browser such as Playwright while keeping the core audit logic unchanged.

## Development Notes

The repo includes CI in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) covering build, lint, and test steps on push and pull request.

Near-term work is tracked in [TODO.md](./TODO.md), with the main focus on broader rule coverage, packaging, and better real-world fixtures.
