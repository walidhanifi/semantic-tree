import { FetchError, fetchHTML, isValidUrl } from "./fetch.js";
import { parseHTML } from "./index.js";

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: checkheadings <url>");
    process.exit(1);
  }

  if (!isValidUrl(url)) {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  try {
    const html = await fetchHTML(url);
    const result = parseHTML(html);
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
