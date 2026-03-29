import express from "express";
import { parseHTML } from "./index.js";

const app = express();
const port = parseInt(process.env.PORT || "8000", 10);

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchHTML(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Upstream server returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    throw new Error("URL did not return HTML content");
  }

  return await response.text();
}

app.get("/", async (req, res) => {
  const url = req.query.u as string;

  if (!url) {
    res
      .status(400)
      .json({ error: "Missing required query parameter: u", status: 400 });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ url, error: "Invalid URL", status: 400 });
    return;
  }

  try {
    const html = await fetchHTML(url);
    const result = parseHTML(html);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      res
        .status(504)
        .json({
          url,
          error: "Request timed out after 10 seconds",
          status: 504,
        });
      return;
    }

    res.status(502).json({ url, error: message, status: 502 });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
