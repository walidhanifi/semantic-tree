import { describe, it, expect } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);
const CLI_PATH = "./dist/cli.js";

describe("cli", () => {
  it("should print usage and exit 1 when no url provided", async () => {
    try {
      await exec("node", [CLI_PATH]);
    } catch (error) {
      const err = error as { stderr: string; code: number };
      expect(err.stderr).toContain("Usage");
      expect(err.code).toBe(1);
    }
  });

  it("should exit 1 for invalid url", async () => {
    try {
      await exec("node", [CLI_PATH, "notaurl"]);
    } catch (error: any) {
      expect(error.stderr).toContain("Invalid URL");
      expect(error.code).toBe(1);
    }
  });

  it("should output valid JSON for a valid url", async () => {
    const { stdout } = await exec("node", [CLI_PATH, "http://google.com"]);
    const result = JSON.parse(stdout);

    expect(result).toHaveProperty("semantic-structure");
    expect(result).toHaveProperty("skipped-levels");
    expect(result).toHaveProperty("incongruent-headings");
  });
});
