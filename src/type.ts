export interface Heading {
  tag: string;
  content: string;
  depth: number;
}

export interface HeadingNode {
  tag: string;
  content: string;
  children?: HeadingNode[]; // ommitted as per README for nodes that don't have it
}

export interface AuditWarning {
  rule: "missing-h1" | "multiple-top-level-h1" | "empty-headings";
  message: string;
  headings: HeadingNode[];
}

export interface ParsingResult {
  "semantic-structure": HeadingNode[];
  "skipped-levels": [HeadingNode, HeadingNode][];
  "incongruent-headings": HeadingNode[];
  warnings: AuditWarning[];
}
