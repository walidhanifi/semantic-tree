import type { FetchMode } from "./fetch.js";
import { FetchError, fetchHTML, isValidUrl } from "./fetch.js";
import { parseHTML } from "./index.js";
import { renderHTMLReport } from "./report.js";

type ReportFormat = "json" | "html";
type RenderMode = "static" | "js";

function parseArgs(args: string[]): {
  url?: string;
  format: ReportFormat;
  renderMode: RenderMode;
} {
  let url: string | undefined;
  let format: ReportFormat = "json";
  let renderMode: RenderMode = "static";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;

    if (arg === "--report") {
      const value = args[index + 1];
      if (value === "html" || value === "json") {
        format = value;
        index += 1;
      }
      continue;
    }

    if (arg === "--render") {
      const value = args[index + 1];
      if (value === "js") {
        renderMode = value;
        index += 1;
      }
      continue;
    }

    if (!arg.startsWith("--") && !url) {
      url = arg;
    }
  }

  return url ? { url, format, renderMode } : { format, renderMode };
}

function toFetchMode(renderMode: RenderMode): FetchMode {
  return renderMode === "js" ? "rendered" : "static";
}

async function main() {
  const { url, format, renderMode } = parseArgs(process.argv.slice(2));

  if (!url) {
    console.error(
      "Usage: heading-audit <url> [--report html|json] [--render js]",
    );
    process.exit(1);
  }

  if (!isValidUrl(url)) {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  try {
    const html = await fetchHTML(url, { mode: toFetchMode(renderMode) });
    const result = parseHTML(html);

    if (format === "html") {
      console.log(renderHTMLReport(result, { sourceUrl: url }));
      return;
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error("Request timed out after 10 seconds");
      process.exit(1);
    }

    if (error instanceof FetchError) {
      console.error(error.message);
      process.exit(1);
    }

    console.error(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main();
