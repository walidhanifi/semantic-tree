import express from "express";
import type { FetchMode } from "./fetch.js";
import { parseHTML } from "./index.js";
import { FetchError, fetchHTML, isValidUrl } from "./fetch.js";
import { buildAuditResponse, toJson, type JsonFormat } from "./output.js";
import { renderHTMLReport } from "./report.js";
import { getCachedHTML, setCachedHTML, takeRateLimitSlot } from "./server-runtime.js";

export const app = express();
const port = parseInt(process.env.PORT || "8000", 10);

function toFetchMode(renderQuery: unknown): FetchMode {
  return renderQuery === "js" ? "rendered" : "static";
}

function toJsonFormat(prettyQuery: unknown): JsonFormat {
  return prettyQuery === "1" || prettyQuery === "true" ? "pretty" : "compact";
}

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      cacheStatus: res.locals.cacheStatus || "skip",
    }),
  );
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get("/", async (req, res) => {
  const url = req.query.u as string;
  const format = req.query.format === "html" ? "html" : "json";
  const mode = toFetchMode(req.query.render);
  const jsonFormat = toJsonFormat(req.query.pretty);

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
    const rateLimit = takeRateLimitSlot(req.ip || "unknown");
    res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(rateLimit.resetAt).toISOString(),
    );

    if (!rateLimit.allowed) {
      res.status(429).json({
        url,
        error: "Rate limit exceeded",
        status: 429,
      });
      return;
    }

    const startedAt = Date.now();
    const cacheKey = `${mode}:${url}`;
    let html = getCachedHTML(cacheKey);
    let cacheStatus: "hit" | "miss" = "hit";

    if (!html) {
      cacheStatus = "miss";
      html = await fetchHTML(url, { mode });
      setCachedHTML(cacheKey, html);
    }

    res.locals.cacheStatus = cacheStatus;
    res.setHeader("X-Cache", cacheStatus.toUpperCase());

    const result = parseHTML(html);
    const response = buildAuditResponse(result, {
      sourceUrl: url,
      fetchDurationMs: Date.now() - startedAt,
      mode,
      cacheStatus,
    });

    if (format === "html") {
      res.type("html").send(renderHTMLReport(response, { sourceUrl: url }));
      return;
    }

    res.type("json").send(toJson(response, jsonFormat));
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
