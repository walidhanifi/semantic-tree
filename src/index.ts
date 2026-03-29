import { load, type CheerioAPI } from "cheerio";
import type { Heading, HeadingNode, ParsingResult } from "./type.js";
import { parseHeadingLevel } from "./utils.js";

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

export function parseHTML(html: string): ParsingResult {
  const $ = load(html);
  const sectionSelector = "section, article, nav, aside";
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

  return {
    "semantic-structure": semanticTree,
    "skipped-levels": skippedLevels,
    "incongruent-headings": incongruentHeadings,
  };
}
