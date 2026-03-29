import { parseHTML } from "./index.js";

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: checkheadings <url>");
    process.exit(1);
  }

  try {
    new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch: HTTP ${response.status}`);
      process.exit(1);
    }
    const html = await response.text();
    const result = parseHTML(html);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(
      `Failed to fetch: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main();
