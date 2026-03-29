import { load, type CheerioAPI } from "cheerio";
import type { HeadingNode, ParsingResult } from "./type.js";

const htmlFromREADME = `
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

const $ = load(htmlFromREADME);

function findSkippedLevels($: CheerioAPI): {
  semanticStructure: HeadingNode[];
  skippedLevels: [HeadingNode, HeadingNode][];
} {
  const htmlHeadings = $("h1, h2, h3, h4, h5, h6");

  const semanticTree = [];
  const stack = [];

  const skippedLevels = [];

  for (const header of htmlHeadings) {
    const headerTag = header.name;
    const headerText = $(header).text();
    const curLevel = parseInt(headerTag.charAt(1));

    const node = {
      tag: headerTag,
      content: headerText,
    };

    // pop stack until we find a parent with a smaller level
    while (stack.length > 0) {
      const topLevel = parseInt(stack.at(-1).tag.charAt(1));
      const levelDiff = curLevel - topLevel;
      if (levelDiff > 0) {
        if (levelDiff > 1) {
          skippedLevels.push(
            {
              tag: stack.at(-1).tag,
              content: stack.at(-1).content,
            },
            {
              tag: headerTag,
              content: headerText,
            },
          );
        }
        break;
      }
      stack.pop();
    }

    // check if root
    if (stack.length === 0) {
      semanticTree.push(node);
    } else {
      const parent = stack.at(-1);
      if (!parent.children) {
        parent.children = []; // set up children arr because we omit it for cleanliness in the beginning
      }
      parent.children.push(node);
    }

    stack.push(node);
  }

  return { semanticStructure: semanticTree, skippedLevels };
}

function checkIncongruence($: CheerioAPI): HeadingNode[] {
  const htmlHeadings = $("h1, h2, h3, h4, h5, h6");
  const sectionContent = "section, article, nav, aside";

  const incongruentHeadings = [];
  let prevDepth = 0;
  let prevLevel = 0;

  for (const header of htmlHeadings) {
    const depth = $(header).parents(sectionContent).length;
    const level = parseInt(header.tagName.charAt(1));

    if (depth > prevDepth && level <= prevLevel) {
      incongruentHeadings.push({
        tag: header.tagName,
        content: $(header).text(),
      });
    }

    prevDepth = depth;
    prevLevel = level;
  }
  return incongruentHeadings;
}

function parseHTML(html: string): ParsingResult {
  const $ = load(html);
  const { semanticStructure, skippedLevels } = findSkippedLevels($);
  const incongruentHeadings = checkIncongruence($);

  return {
    "semantic-structure": semanticStructure,
    "skipped-levels": skippedLevels,
    "incongruent-headings": incongruentHeadings,
  };
}

const output = JSON.stringify(parseHTML(htmlFromREADME));
console.dir(output, { depth: null });
