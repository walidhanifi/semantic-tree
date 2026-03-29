import express from "express";
import { parseHTML } from "./index.js";

const app = express();
const port = 8000;

app.get("/", async (req, res) => {
  const url = req.query.u as string;

  if (!url) {
    res.status(400).json({ error: "Missing required query parameter: u" });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: `Invalid URL: ${url}` });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res
        .status(502)
        .json({ error: `Failed to fetch: HTTP ${response.status}` });
      return;
    }
    const html = await response.text();
    const result = parseHTML(html);
    res.json(result);
  } catch (error) {
    res.status(502).json({
      error: `Failed to fetch: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
