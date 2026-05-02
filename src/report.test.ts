import { describe, expect, it } from "vitest";
import { renderHTMLReport } from "./report.js";
import type { ParsingResult } from "./type.js";

describe("renderHTMLReport", () => {
  it("should render a readable report with escaped content", () => {
    const result: ParsingResult = {
      "semantic-structure": [
        {
          tag: "h1",
          content: "Landing <title>",
          children: [{ tag: "h2", content: "" }],
        },
      ],
      "skipped-levels": [[{ tag: "h2", content: "Alpha" }, { tag: "h4", content: "Beta" }]],
      "incongruent-headings": [{ tag: "h2", content: "Nested issue" }],
      warnings: [
        {
          rule: "empty-headings",
          message: "Document contains headings with no text content",
          headings: [{ tag: "h2", content: "" }],
        },
      ],
    };

    const html = renderHTMLReport(result, {
      sourceUrl: "https://example.com?a=1&b=2",
    });

    expect(html).toContain("<title>Semantic Tree Report</title>");
    expect(html).toContain("Landing &lt;title&gt;");
    expect(html).toContain("https://example.com?a=1&amp;b=2");
    expect(html).toContain("Skipped levels");
    expect(html).toContain("Warnings");
    expect(html).toContain("(empty)");
  });
});
