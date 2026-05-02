import { describe, expect, it, vi } from "vitest";
import { buildAuditResponse, toJson } from "./output.js";
import type { ParsingResult } from "./type.js";

describe("buildAuditResponse", () => {
  it("should attach metadata and heading counts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-02T03:00:00.000Z"));

    const result: ParsingResult = {
      "semantic-structure": [
        {
          tag: "h1",
          content: "Root",
          children: [{ tag: "h2", content: "Child" }],
        },
      ],
      "skipped-levels": [[{ tag: "h2", content: "A" }, { tag: "h4", content: "B" }]],
      "incongruent-headings": [{ tag: "h2", content: "Out of place" }],
      warnings: [
        {
          rule: "empty-headings",
          message: "Document contains headings with no text content",
          headings: [{ tag: "h3", content: "" }],
        },
      ],
    };

    const response = buildAuditResponse(result, {
      sourceUrl: "https://example.com",
      fetchDurationMs: 42,
      mode: "rendered",
    });

    expect(response.metadata).toStrictEqual({
      sourceUrl: "https://example.com",
      fetchedAt: "2026-05-02T03:00:00.000Z",
      fetchDurationMs: 42,
      mode: "rendered",
      cacheStatus: "miss",
      headingCounts: {
        total: 2,
        skippedLevelPairs: 1,
        incongruent: 1,
        warnings: 1,
      },
    });

    vi.useRealTimers();
  });
});

describe("toJson", () => {
  it("should pretty print json", () => {
    expect(toJson({ ok: true }, "pretty")).toContain('\n  "ok": true\n');
  });

  it("should compact json", () => {
    expect(toJson({ ok: true }, "compact")).toBe('{"ok":true}');
  });
});
