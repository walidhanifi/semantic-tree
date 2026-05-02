import type { ParsingResult } from "./type.js";

export type JsonFormat = "pretty" | "compact";
export type ResponseMode = "static" | "rendered";

export interface AuditMetadata {
  sourceUrl: string;
  fetchedAt: string;
  fetchDurationMs: number;
  mode: ResponseMode;
  headingCounts: {
    total: number;
    skippedLevelPairs: number;
    incongruent: number;
    warnings: number;
  };
}

export interface AuditResponse extends ParsingResult {
  metadata: AuditMetadata;
}

function countHeadings(nodes: ParsingResult["semantic-structure"]): number {
  let total = 0;

  for (const node of nodes) {
    total += 1;
    if (node.children) total += countHeadings(node.children);
  }

  return total;
}

export function buildAuditResponse(
  result: ParsingResult,
  options: {
    sourceUrl: string;
    fetchDurationMs: number;
    mode: ResponseMode;
  },
): AuditResponse {
  return {
    ...result,
    metadata: {
      sourceUrl: options.sourceUrl,
      fetchedAt: new Date().toISOString(),
      fetchDurationMs: options.fetchDurationMs,
      mode: options.mode,
      headingCounts: {
        total: countHeadings(result["semantic-structure"]),
        skippedLevelPairs: result["skipped-levels"].length,
        incongruent: result["incongruent-headings"].length,
        warnings: result.warnings.length,
      },
    },
  };
}

export function toJson(value: unknown, format: JsonFormat): string {
  return JSON.stringify(value, null, format === "pretty" ? 2 : 0);
}
