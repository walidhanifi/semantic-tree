import { describe, expect, it } from "vitest";
import {
  checkIncongruence,
  collectWarnings,
  extractStructure,
  parseHTML,
} from "./index.js";
import type { Heading } from "./type.js";

// unit tests
describe("extractStructure", () => {
  it("should return empty tree & skipped levels for empty input", () => {
    const { semanticTree, skippedLevels } = extractStructure([]);

    expect(semanticTree).toStrictEqual([]);
    expect(skippedLevels).toStrictEqual([]);
  });
  it("should handle a single heading as root", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "one heading -> one root", depth: 0 },
    ];

    const { semanticTree } = extractStructure(headings);

    expect(semanticTree).toStrictEqual([
      { tag: "h1", content: "one heading -> one root" },
    ]);
  });
  it("should create siblings at the same level", () => {
    const headings: Heading[] = [
      { tag: "h2", content: "some guy", depth: 0 },
      { tag: "h2", content: "some guys sibling", depth: 0 },
      { tag: "h2", content: "the third sibling", depth: 0 },
    ];

    const { semanticTree } = extractStructure(headings);

    expect(semanticTree).toStrictEqual([
      { tag: "h2", content: "some guy" },
      { tag: "h2", content: "some guys sibling" },
      { tag: "h2", content: "the third sibling" },
    ]);
  });
  it("should create children nested in parent", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "a parent", depth: 0 },
      { tag: "h2", content: "child of parent", depth: 1 },
      { tag: "h3", content: "the grandchild", depth: 2 },
    ];

    const { semanticTree } = extractStructure(headings);

    expect(semanticTree).toStrictEqual([
      {
        tag: "h1",
        content: "a parent",
        children: [
          {
            tag: "h2",
            content: "child of parent",
            children: [{ tag: "h3", content: "the grandchild" }],
          },
        ],
      },
    ]);
  });
  it("should create multi rooted tree structure when multiple roots", () => {
    const headings: Heading[] = [
      { tag: "h2", content: "root one", depth: 0 },
      { tag: "h3", content: "root one child, valid", depth: 1 },
      { tag: "h2", content: "root two", depth: 0 },
    ];

    const { semanticTree } = extractStructure(headings);

    expect(semanticTree).toStrictEqual([
      {
        tag: "h2",
        content: "root one",
        children: [{ tag: "h3", content: "root one child, valid" }],
      },
      { tag: "h2", content: "root two" },
    ]);
  });
  it("should not incl empty children nodes in output tree", () => {
    // as specified in my README, this one was not specified but included as per the output structure (no empty children)
    const headings: Heading[] = [{ tag: "h1", content: "hi there", depth: 0 }];

    const { semanticTree } = extractStructure(headings);

    expect(semanticTree[0]).not.toHaveProperty("children");
  });
  it("should detect skipped levels when headings jump more than one level", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "some content", depth: 0 },
      { tag: "h3", content: "big skip", depth: 1 },
    ];

    const { skippedLevels } = extractStructure(headings);

    expect(skippedLevels).toStrictEqual([
      [
        { tag: "h1", content: "some content" },
        { tag: "h3", content: "big skip" },
      ],
    ]);
  });
  it("should not flag going from deeper heading to a shallower head as a skip", () => {
    // remembering that h1 -> h4 is a skip (bad), but h4 -> h1 is legal, and is not considered a skip
    const headings: Heading[] = [
      { tag: "h1", content: "some content", depth: 0 },
      { tag: "h4", content: "big skip", depth: 1 },
      { tag: "h2", content: "reset back up, allowed", depth: 1 },
    ];

    const { skippedLevels } = extractStructure(headings);

    expect(skippedLevels).toHaveLength(1); // expect only 1 skip
    expect(skippedLevels).toStrictEqual([
      [
        { tag: "h1", content: "some content" },
        { tag: "h4", content: "big skip" },
      ],
    ]);
  });
  it("should detect multiple consecutive skipped levels", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "root", depth: 0 },
      { tag: "h3", content: "skipped 1 level here", depth: 1 },
      { tag: "h1", content: "second root", depth: 0 },
      { tag: "h4", content: "skipped 2 levels here", depth: 1 },
    ];

    const { skippedLevels } = extractStructure(headings);

    expect(skippedLevels).toStrictEqual([
      [
        { tag: "h1", content: "root" },
        { tag: "h3", content: "skipped 1 level here" },
      ],
      [
        { tag: "h1", content: "second root" },
        { tag: "h4", content: "skipped 2 levels here" },
      ],
    ]);
  });
  it("should build correct tree/skipped levels from README example", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "Heading 1", depth: 1 },
      { tag: "h2", content: "Heading 2", depth: 2 },
      { tag: "h2", content: "Another Heading 2", depth: 2 },
      { tag: "h3", content: "Heading 3", depth: 3 },
      { tag: "h4", content: "Heading 4", depth: 4 },
      { tag: "h2", content: "An out of place Heading 2", depth: 5 },
      { tag: "h5", content: "Heading 5", depth: 5 },
    ];

    const { semanticTree, skippedLevels } = extractStructure(headings);

    expect(semanticTree).toStrictEqual([
      {
        tag: "h1",
        content: "Heading 1",
        children: [
          { tag: "h2", content: "Heading 2" },
          {
            tag: "h2",
            content: "Another Heading 2",
            children: [
              {
                tag: "h3",
                content: "Heading 3",
                children: [{ tag: "h4", content: "Heading 4" }],
              },
            ],
          },
          {
            tag: "h2",
            content: "An out of place Heading 2",
            children: [{ tag: "h5", content: "Heading 5" }],
          },
        ],
      },
    ]);

    expect(skippedLevels).toStrictEqual([
      [
        { tag: "h2", content: "An out of place Heading 2" },
        { tag: "h5", content: "Heading 5" },
      ],
    ]);
  });
});

describe("checkIncongruence", () => {
  it("should return empty arr for empty input", () => {
    const result = checkIncongruence([]);

    expect(result).toStrictEqual([]);
  });
  it("should return empty arr when no incongruence detected", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "first layer", depth: 1 },
      { tag: "h2", content: "second layer", depth: 2 },
      { tag: "h3", content: "third layer", depth: 3 },
    ];

    const result = checkIncongruence(headings);

    expect(result).toStrictEqual([]);
  });
  it("should detect heading nested deeper than its level suggests", () => {
    const headings: Heading[] = [
      { tag: "h4", content: "some content", depth: 1 },
      { tag: "h2", content: "i should not be this deep", depth: 2 },
    ];

    const result = checkIncongruence(headings);

    expect(result).toStrictEqual([
      { tag: "h2", content: "i should not be this deep" },
    ]);
  });
  it("should allow headings that return to shallower sections", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "first layer", depth: 1 },
      { tag: "h3", content: "deeper layer", depth: 3 },
      { tag: "h2", content: "reset back (allowed)", depth: 1 },
    ];

    const result = checkIncongruence(headings);

    expect(result).toStrictEqual([]);
  });
  it("should detect incongruence from README example", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "Heading 1", depth: 1 },
      { tag: "h2", content: "Heading 2", depth: 2 },
      { tag: "h2", content: "Another Heading 2", depth: 2 },
      { tag: "h3", content: "Heading 3", depth: 3 },
      { tag: "h4", content: "Heading 4", depth: 4 },
      { tag: "h2", content: "An out of place Heading 2", depth: 5 },
      { tag: "h5", content: "Heading 5", depth: 5 },
    ];

    const result = checkIncongruence(headings);

    expect(result).toStrictEqual([
      { tag: "h2", content: "An out of place Heading 2" },
    ]);
  });
});

describe("collectWarnings", () => {
  it("should warn when the document has no h1", () => {
    const headings: Heading[] = [{ tag: "h2", content: "Section", depth: 0 }];
    const { semanticTree } = extractStructure(headings);

    const result = collectWarnings(headings, semanticTree);

    expect(result).toStrictEqual([
      {
        rule: "missing-h1",
        message: "Document does not contain an h1 heading",
        headings: [],
      },
    ]);
  });

  it("should warn when multiple top-level h1 headings exist", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "First", depth: 0 },
      { tag: "h1", content: "Second", depth: 0 },
    ];
    const { semanticTree } = extractStructure(headings);

    const result = collectWarnings(headings, semanticTree);

    expect(result).toStrictEqual([
      {
        rule: "multiple-top-level-h1",
        message: "Document contains multiple top-level h1 headings",
        headings: [
          { tag: "h1", content: "First" },
          { tag: "h1", content: "Second" },
        ],
      },
    ]);
  });

  it("should warn when empty headings are present", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "Title", depth: 0 },
      { tag: "h2", content: "", depth: 1 },
      { tag: "h3", content: "", depth: 2 },
    ];
    const { semanticTree } = extractStructure(headings);

    const result = collectWarnings(headings, semanticTree);

    expect(result).toStrictEqual([
      {
        rule: "empty-headings",
        message: "Document contains headings with no text content",
        headings: [
          { tag: "h2", content: "" },
          { tag: "h3", content: "" },
        ],
      },
    ]);
  });

  it("should warn when headings are hidden", () => {
    const headings: Heading[] = [
      { tag: "h1", content: "Title", depth: 0 },
      { tag: "h2", content: "Hidden block", depth: 1, isHidden: true },
    ];
    const { semanticTree } = extractStructure(headings);

    const result = collectWarnings(headings, semanticTree);

    expect(result).toStrictEqual([
      {
        rule: "hidden-headings",
        message:
          "Document contains headings hidden from assistive technologies or visual layout",
        headings: [{ tag: "h2", content: "Hidden block" }],
      },
    ]);
  });

  it("should respect enabled warning rules", () => {
    const headings: Heading[] = [
      { tag: "h2", content: "", depth: 0, isHidden: true },
    ];
    const { semanticTree } = extractStructure(headings);

    const result = collectWarnings(headings, semanticTree, {
      enabledWarnings: ["hidden-headings"],
    });

    expect(result).toStrictEqual([
      {
        rule: "hidden-headings",
        message:
          "Document contains headings hidden from assistive technologies or visual layout",
        headings: [{ tag: "h2", content: "" }],
      },
    ]);
  });
});

// integration test, HTML string in and full JSON out
describe("parseHTML", () => {
  it("should return empty arr's for no loaded HTML headings", () => {
    const html = `
<section>
  <div>
    Just some text, no headings here
  </div>
  <section>
    <span>
      None here as well
    </span>
  </section>
</section>
`;

    const expectedOutput = {
      "semantic-structure": [],
      "skipped-levels": [],
      "incongruent-headings": [],
      warnings: [
        {
          rule: "missing-h1",
          message: "Document does not contain an h1 heading",
          headings: [],
        },
      ],
    };

    const result = parseHTML(html);

    expect(result).toStrictEqual(expectedOutput);
  });
  it("should trim whitespace from header text/content", () => {
    const html = `
<section>
  <h1>
    Heading 1
  </h1>
  <section>
    <h2>
      Heading 2
    </h2>
  </section>
</section>
`;

    const expectedOutput = {
      "semantic-structure": [
        {
          tag: "h1",
          content: "Heading 1",
          children: [{ tag: "h2", content: "Heading 2" }],
        },
      ],
      "skipped-levels": [],
      "incongruent-headings": [],
      warnings: [],
    };

    const result = parseHTML(html);

    expect(result).toStrictEqual(expectedOutput);
  });
  it("should give correct output (JSON) for specified README example", () => {
    const readmeHTML = `
<section>
  <h1>Heading 1</h1>
  <section>
    <h2>Heading 2</h2>
    <h2>Another Heading 2</h2>
    <section>
      <h3>Heading 3</h3>
      <section>
        <h4>Heading 4</h4>
        <section>
          <h2>An out of place Heading 2</h2>
          <h5>Heading 5</h5>
        </section>
      </section>
    </section>
  </section>
</section>
`;

    const readmeOutput = {
      "semantic-structure": [
        {
          tag: "h1",
          content: "Heading 1",
          children: [
            { tag: "h2", content: "Heading 2" },
            {
              tag: "h2",
              content: "Another Heading 2",
              children: [
                {
                  tag: "h3",
                  content: "Heading 3",
                  children: [{ tag: "h4", content: "Heading 4" }],
                },
              ],
            },
            {
              tag: "h2",
              content: "An out of place Heading 2",
              children: [{ tag: "h5", content: "Heading 5" }],
            },
          ],
        },
      ],
      "skipped-levels": [
        [
          { tag: "h2", content: "An out of place Heading 2" },
          { tag: "h5", content: "Heading 5" },
        ],
      ],
      "incongruent-headings": [
        { tag: "h2", content: "An out of place Heading 2" },
      ],
      warnings: [],
    };

    const result = parseHTML(readmeHTML);

    expect(result).toStrictEqual(readmeOutput);
  });

  it("should include warnings for empty headings and multiple top-level h1s", () => {
    const html = `
<main>
  <h1>Overview</h1>
  <h1>Overview copy</h1>
  <section>
    <h2> </h2>
  </section>
</main>
`;

    const result = parseHTML(html);

    expect(result.warnings).toStrictEqual([
      {
        rule: "multiple-top-level-h1",
        message: "Document contains multiple top-level h1 headings",
        headings: [
          { tag: "h1", content: "Overview" },
          { tag: "h1", content: "Overview copy" },
        ],
      },
      {
        rule: "empty-headings",
        message: "Document contains headings with no text content",
        headings: [{ tag: "h2", content: "" }],
      },
    ]);
  });

  it("should detect hidden headings in html", () => {
    const html = `
<main>
  <h1>Overview</h1>
  <h2 hidden>Hidden for layout</h2>
  <h3 aria-hidden="true">Screen-reader hidden</h3>
</main>
`;

    const result = parseHTML(html);

    expect(result.warnings).toContainEqual({
      rule: "hidden-headings",
      message:
        "Document contains headings hidden from assistive technologies or visual layout",
      headings: [
        { tag: "h2", content: "Hidden for layout" },
        { tag: "h3", content: "Screen-reader hidden" },
      ],
    });
  });

  it("should allow warning rules to be narrowed at parse time", () => {
    const html = `
<main>
  <h2 hidden>Only one warning should remain</h2>
</main>
`;

    const result = parseHTML(html, {
      enabledWarnings: ["hidden-headings"],
    });

    expect(result.warnings).toStrictEqual([
      {
        rule: "hidden-headings",
        message:
          "Document contains headings hidden from assistive technologies or visual layout",
        headings: [{ tag: "h2", content: "Only one warning should remain" }],
      },
    ]);
  });
});
