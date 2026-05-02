import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseHTML } from "./index.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(currentDir, "..", "fixtures");

const cases = [
  "docs-page",
  "blog-post",
  "marketing-page",
] as const;

describe("real-world fixtures", () => {
  for (const name of cases) {
    it(`matches the saved output for ${name}`, () => {
      const html = readFileSync(
        path.join(fixturesDir, `${name}.html`),
        "utf8",
      );
      const expected = JSON.parse(
        readFileSync(path.join(fixturesDir, `${name}.expected.json`), "utf8"),
      );

      expect(parseHTML(html)).toStrictEqual(expected);
    });
  }
});
