import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./render.js", () => ({
  renderPageHTML: vi.fn(async () => "<main><h1>Rendered page</h1></main>"),
}));

import { renderPageHTML } from "./render.js";
import { FetchError, fetchHTML, isValidUrl } from "./fetch.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isValidUrl", () => {
  it("should accept http and https urls", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path")).toBe(true);
  });

  it("should reject malformed or unsupported urls", () => {
    expect(isValidUrl("notaurl")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });
});

describe("fetchHTML", () => {
  it("should return html for a valid static response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<main><h1>Static page</h1></main>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    await expect(fetchHTML("https://example.com")).resolves.toContain(
      "Static page",
    );
  });

  it("should reject non-html responses in static mode", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchHTML("https://example.com")).rejects.toMatchObject({
      name: "FetchError",
      message: "URL did not return HTML content",
      status: 422,
    } satisfies Partial<FetchError>);
  });

  it("should delegate rendered mode to playwright", async () => {
    await expect(
      fetchHTML("https://example.com/app", { mode: "rendered" }),
    ).resolves.toContain("Rendered page");

    expect(renderPageHTML).toHaveBeenCalledWith("https://example.com/app");
  });
});
