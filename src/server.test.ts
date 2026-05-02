import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("./render.js", () => ({
  renderPageHTML: vi.fn(async () => "<main><h1>Rendered app</h1></main>"),
}));

import { app } from "./server.js";
import { renderPageHTML } from "./render.js";
import {
  clearRateLimitStore,
  clearResponseCache,
} from "./server-runtime.js";

afterEach(() => {
  vi.restoreAllMocks();
  clearResponseCache();
  clearRateLimitStore();
  delete process.env.CACHE_TTL_MS;
  delete process.env.RATE_LIMIT_MAX;
  delete process.env.RATE_LIMIT_WINDOW_MS;
});

describe("server", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number));
  });

  it("should return 400 when url is missing", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Missing required");
  });

  it("should return 400 for invalid url", async () => {
    const response = await request(app).get("/?u=fakeurllol");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid URL");
  });

  it("should return valid JSON for a valid url", async () => {
    const response = await request(app).get("/?u=http://google.com");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("semantic-structure");
    expect(response.body).toHaveProperty("skipped-levels");
    expect(response.body).toHaveProperty("incongruent-headings");
    expect(response.body).toHaveProperty("metadata");
  });

  it("should return 502 for unreachable host", async () => {
    const response = await request(app).get(
      "/?u=http://this.hostisunreachable",
    );

    expect(response.status).toBe(502);
  });

  it("should render an html report when requested", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Home</h1><h2>Intro</h2></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const response = await request(app).get(
      "/?u=https://example.com&format=html",
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("Semantic Tree Report");
    expect(response.text).toContain("https://example.com");
  });

  it("should accept rendered mode through the query string", async () => {
    const response = await request(app).get(
      "/?u=https://example.com&render=js",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("semantic-structure");
    expect(response.body.metadata.mode).toBe("rendered");
    expect(renderPageHTML).toHaveBeenCalledWith("https://example.com");
  });

  it("should allow warning rules to be selected through the query string", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h2 hidden>Only hidden</h2></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const response = await request(app).get(
      "/?u=https://example.com&rules=hidden-headings",
    );

    expect(response.status).toBe(200);
    expect(response.body.warnings).toStrictEqual([
      {
        rule: "hidden-headings",
        message:
          "Document contains headings hidden from assistive technologies or visual layout",
        headings: [{ tag: "h2", content: "Only hidden" }],
      },
    ]);
    expect(response.body.metadata.rules.enabledWarnings).toStrictEqual([
      "hidden-headings",
    ]);
  });

  it("should pretty print json when requested", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Home</h1></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const response = await request(app).get(
      "/?u=https://example.com&pretty=1",
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain('\n  "semantic-structure"');
  });

  it("should log requests as structured json", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Home</h1></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const response = await request(app).get("/?u=https://example.com");

    expect(response.status).toBe(200);
    expect(logSpy).toHaveBeenCalled();

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.method).toBe("GET");
    expect(payload.path).toBe("/");
    expect(payload.status).toBe(200);
    expect(payload.durationMs).toEqual(expect.any(Number));
  });

  it("should cache repeated requests for the same url and mode", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Home</h1></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const first = await request(app).get("/?u=https://example.com");
    const second = await request(app).get("/?u=https://example.com");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers["x-cache"]).toBe("MISS");
    expect(second.headers["x-cache"]).toBe("HIT");
    expect(second.body.metadata.cacheStatus).toBe("hit");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("should rate limit repeated requests from the same client", async () => {
    process.env.RATE_LIMIT_MAX = "1";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Home</h1></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const first = await request(app).get("/?u=https://example.com/one");
    const second = await request(app).get("/?u=https://example.com/two");

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("Rate limit exceeded");
    expect(second.headers["x-ratelimit-remaining"]).toBe("0");
  });
});
