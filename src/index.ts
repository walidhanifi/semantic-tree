import { load } from "cheerio";
import type {
  AuditWarning,
  Heading,
  HeadingNode,
  ParsingResult,
} from "./type.js";
import { parseHeadingLevel } from "./utils.js";

function toHeadingNode(heading: Heading): HeadingNode {
  return {
    tag: heading.tag,
    content: heading.content,
  };
}

/** Builds a semantic tree from a flat heading array and detects skipped levels */
export function extractStructure(headings: Heading[]): {
  semanticTree: HeadingNode[];
  skippedLevels: [HeadingNode, HeadingNode][];
} {
  const semanticTree: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  const skippedLevels: [HeadingNode, HeadingNode][] = [];

  for (const header of headings) {
    const curLevel = parseHeadingLevel(header.tag);

    const node: HeadingNode = {
      tag: header.tag,
      content: header.content,
    };

    // pop stack until we find a parent with a smaller level
    let top = stack.at(-1);
    while (top && stack.length > 0) {
      const topLevel = parseHeadingLevel(top.tag);
      const levelDiff = curLevel - topLevel;
      if (levelDiff > 0) {
        if (levelDiff > 1) {
          skippedLevels.push([
            { tag: top.tag, content: top.content },
            { tag: header.tag, content: header.content },
          ]);
        }
        break;
      }
      stack.pop();
      top = stack.at(-1);
    }

    // attach to parent or add as root if no parent exists
    const parent = stack.at(-1);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      semanticTree.push(node);
    }

    // always push current node onto stack
    stack.push(node);
  }

  return { semanticTree, skippedLevels };
}

/** Detects headings whose level conflicts with their section nesting depth */
export function checkIncongruence(headings: Heading[]): HeadingNode[] {
  const incongruentHeadings: HeadingNode[] = [];
  let prevDepth = 0;
  let prevLevel = 0;

  for (const header of headings) {
    const level = parseHeadingLevel(header.tag);

    if (header.depth > prevDepth && level <= prevLevel) {
      incongruentHeadings.push({
        tag: header.tag,
        content: header.content,
      });
    }

    prevDepth = header.depth;
    prevLevel = level;
  }
  return incongruentHeadings;
}

export function collectWarnings(
  headings: Heading[],
  semanticTree: HeadingNode[],
): AuditWarning[] {
  const warnings: AuditWarning[] = [];

  const hasH1 = headings.some((heading) => heading.tag === "h1");
  if (!hasH1) {
    warnings.push({
      rule: "missing-h1",
      message: "Document does not contain an h1 heading",
      headings: [],
    });
  }

  const topLevelH1s = semanticTree.filter((node) => node.tag === "h1");
  if (topLevelH1s.length > 1) {
    warnings.push({
      rule: "multiple-top-level-h1",
      message: "Document contains multiple top-level h1 headings",
      headings: topLevelH1s.map((heading) => ({
        tag: heading.tag,
        content: heading.content,
      })),
    });
  }

  const emptyHeadings = headings
    .filter((heading) => heading.content.length === 0)
    .map(toHeadingNode);

  if (emptyHeadings.length > 0) {
    warnings.push({
      rule: "empty-headings",
      message: "Document contains headings with no text content",
      headings: emptyHeadings,
    });
  }

  return warnings;
}

/** Parses HTML and returns semantic structure, skipped levels, and incongruent headings */
export function parseHTML(html: string): ParsingResult {
  const $ = load(html);
  const sectionSelector = "section, article, nav, aside, div";
  const htmlHeadings = $("h1, h2, h3, h4, h5, h6");

  const headings: Heading[] = [];
  for (const header of htmlHeadings) {
    headings.push({
      tag: header.tagName,
      content: $(header).text().trim(),
      depth: $(header).parents(sectionSelector).length,
    });
  }

  const { semanticTree, skippedLevels } = extractStructure(headings);
  const incongruentHeadings = checkIncongruence(headings);
  const warnings = collectWarnings(headings, semanticTree);

  return {
    "semantic-structure": semanticTree,
    "skipped-levels": skippedLevels,
    "incongruent-headings": incongruentHeadings,
    warnings,
  };
}
