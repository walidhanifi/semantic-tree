import type { HeadingNode, ParsingResult } from "./type.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function countNodes(nodes: HeadingNode[]): number {
  let total = 0;

  for (const node of nodes) {
    total += 1;
    if (node.children) total += countNodes(node.children);
  }

  return total;
}

function renderHeadingTree(nodes: HeadingNode[]): string {
  if (nodes.length === 0) {
    return "<p>No headings found.</p>";
  }

  const items = nodes
    .map((node) => {
      const children = node.children ? renderHeadingTree(node.children) : "";

      return `
        <li>
          <strong>${escapeHtml(node.tag)}</strong>
          <span>${escapeHtml(node.content || "(empty)")}</span>
          ${children}
        </li>
      `;
    })
    .join("");

  return `<ul>${items}</ul>`;
}

function renderHeadingList(headings: HeadingNode[]): string {
  if (headings.length === 0) {
    return "<p>None.</p>";
  }

  const items = headings
    .map(
      (heading) =>
        `<li><strong>${escapeHtml(heading.tag)}</strong> ${escapeHtml(heading.content || "(empty)")}</li>`,
    )
    .join("");

  return `<ul>${items}</ul>`;
}

function renderSkippedLevels(
  skippedLevels: ParsingResult["skipped-levels"],
): string {
  if (skippedLevels.length === 0) {
    return "<p>None.</p>";
  }

  const items = skippedLevels
    .map(
      ([from, to]) => `
        <li>
          <strong>${escapeHtml(from.tag)}</strong> ${escapeHtml(from.content || "(empty)")}
          to
          <strong>${escapeHtml(to.tag)}</strong> ${escapeHtml(to.content || "(empty)")}
        </li>
      `,
    )
    .join("");

  return `<ul>${items}</ul>`;
}

function renderWarnings(warnings: ParsingResult["warnings"]): string {
  if (warnings.length === 0) {
    return "<p>None.</p>";
  }

  const items = warnings
    .map((warning) => {
      const headings =
        warning.headings.length > 0
          ? renderHeadingList(warning.headings)
          : "<p>No affected headings to list.</p>";

      return `
        <li>
          <h3>${escapeHtml(warning.rule)}</h3>
          <p>${escapeHtml(warning.message)}</p>
          ${headings}
        </li>
      `;
    })
    .join("");

  return `<ul>${items}</ul>`;
}

export function renderHTMLReport(
  result: ParsingResult,
  options: { sourceUrl?: string } = {},
): string {
  const totalHeadings = countNodes(result["semantic-structure"]);
  const sourceUrl = options.sourceUrl
    ? `<p class="source">${escapeHtml(options.sourceUrl)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Semantic Tree Report</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3efe7;
        --panel: #fffaf2;
        --ink: #1f1a14;
        --muted: #74685b;
        --line: #d8cdbf;
        --accent: #b8562a;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(184, 86, 42, 0.16), transparent 28%),
          linear-gradient(180deg, #f7f2ea 0%, var(--bg) 100%);
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 48px 20px 64px;
      }

      header {
        margin-bottom: 32px;
      }

      h1,
      h2,
      h3,
      p,
      ul {
        margin-top: 0;
      }

      h1 {
        font-size: clamp(2.4rem, 5vw, 4.2rem);
        line-height: 0.95;
        margin-bottom: 12px;
      }

      .source,
      .eyebrow {
        color: var(--muted);
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 32px;
      }

      .card,
      section {
        background: rgba(255, 250, 242, 0.88);
        border: 1px solid var(--line);
        border-radius: 18px;
        box-shadow: 0 14px 40px rgba(31, 26, 20, 0.06);
      }

      .card {
        padding: 18px;
      }

      .card strong {
        display: block;
        font-size: 2rem;
        color: var(--accent);
      }

      .sections {
        display: grid;
        gap: 18px;
      }

      section {
        padding: 22px;
      }

      ul {
        padding-left: 20px;
      }

      li + li {
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Static HTML heading analysis</p>
        <h1>Semantic Tree Report</h1>
        ${sourceUrl}
      </header>

      <div class="summary">
        <div class="card">
          <strong>${totalHeadings}</strong>
          <span>Total headings</span>
        </div>
        <div class="card">
          <strong>${result["skipped-levels"].length}</strong>
          <span>Skipped level pairs</span>
        </div>
        <div class="card">
          <strong>${result["incongruent-headings"].length}</strong>
          <span>Incongruent headings</span>
        </div>
        <div class="card">
          <strong>${result.warnings.length}</strong>
          <span>Warnings</span>
        </div>
      </div>

      <div class="sections">
        <section>
          <h2>Semantic structure</h2>
          ${renderHeadingTree(result["semantic-structure"])}
        </section>

        <section>
          <h2>Skipped levels</h2>
          ${renderSkippedLevels(result["skipped-levels"])}
        </section>

        <section>
          <h2>Incongruent headings</h2>
          ${renderHeadingList(result["incongruent-headings"])}
        </section>

        <section>
          <h2>Warnings</h2>
          ${renderWarnings(result.warnings)}
        </section>
      </div>
    </main>
  </body>
</html>`;
}
