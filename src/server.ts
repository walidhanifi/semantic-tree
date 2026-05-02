import express from "express";
import type { FetchMode } from "./fetch.js";
import { parseHTML } from "./index.js";
import { FetchError, fetchHTML, isValidUrl } from "./fetch.js";
import { renderHTMLReport } from "./report.js";

export const app = express();
const port = parseInt(process.env.PORT || "8000", 10);

function toFetchMode(renderQuery: unknown): FetchMode {
  return renderQuery === "js" ? "rendered" : "static";
}

app.get("/", async (req, res) => {
  const url = req.query.u as string;
  const format = req.query.format === "html" ? "html" : "json";
  const mode = toFetchMode(req.query.render);

  if (!url) {
    res.status(400).json({
      error: "Missing required url query parameter",
      status: 400,
    });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({
      url,
      error: "Invalid URL",
      status: 400,
    });
    return;
  }

  try {
    const html = await fetchHTML(url, { mode });
    const result = parseHTML(html);

    if (format === "html") {
      res.type("html").send(renderHTMLReport(result, { sourceUrl: url }));
      return;
    }

    res.json(result);
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      res.status(504).json({
        url,
        error: "Request timed out after 10 seconds",
        status: 504,
      });
      return;
    }

    if (error instanceof FetchError) {
      res.status(error.status).json({
        url,
        error: error.message,
        status: error.status,
      });
      return;
    }

    res.status(502).json({
      url,
      error: `Failed to fetch: ${error instanceof Error ? error.message : String(error)}`,
      status: 502,
    });
  }
});

if (process.argv[1]?.includes("server")) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
