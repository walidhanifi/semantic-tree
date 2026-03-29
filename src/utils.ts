export function parseHeadingLevel(tag: string): number {
  return parseInt(tag.charAt(1), 10);
}
