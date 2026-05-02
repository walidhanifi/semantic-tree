import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "./server.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server", () => {
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
    expect(response.text).toContain("Heading Audit Report");
    expect(response.text).toContain("https://example.com");
  });
});
