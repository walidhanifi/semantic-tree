export interface Heading {
  tag: string;
  content: string;
  depth: number;
  isHidden?: boolean;
}

export interface HeadingNode {
  tag: string;
  content: string;
  children?: HeadingNode[]; // ommitted as per README for nodes that don't have it
}

export type WarningRule =
  | "missing-h1"
  | "multiple-top-level-h1"
  | "empty-headings"
  | "hidden-headings";

export interface ParseOptions {
  enabledWarnings?: WarningRule[];
}

export interface AuditWarning {
  rule: WarningRule;
  message: string;
  headings: HeadingNode[];
}

export interface ParsingResult {
  "semantic-structure": HeadingNode[];
  "skipped-levels": [HeadingNode, HeadingNode][];
  "incongruent-headings": HeadingNode[];
  warnings: AuditWarning[];
}
