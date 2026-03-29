import { describe, expect, it } from "vitest";
import { checkIncongruence, extractStructure, parseHTML } from "./index.js";
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
    // siblings are headings on the same level
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

// integration test —> i.e. HTML string in, full JSON out
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

    //! IMPORTANT NOTE: the spec uses the word tuple for skipped levels but the example output is flat
    //! i have implemented tuples [[prev, current], ...] as this matches the spec requirements, with the assumption that output needs adjustment
    //! sent an email just to touch base and confirm this
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
    };

    const result = parseHTML(readmeHTML);

    expect(result).toStrictEqual(readmeOutput);
  });
});
