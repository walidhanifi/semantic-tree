import { describe, it } from "vitest";

// TODO: Come back and insert test logic later

// unit tests
describe("extractStructure", () => {
  it("should return empty tree & skipped levels for empty input");
  it("should handle a single heading as root");
  it("should create siblings at the same level");
  it("should create children nested deeper");
  it("should create multiple roots when no h1 exists");
  it("should not incl empty children nodes in output tree");
  it("should detect skipped levels when headings jump more than one level");
  it("should not flag going from deeper heading to a shallower head as a skip");
  it("should detect multiple consecutive skipped levels");
  it("should build correct tree/skipped levels from README example");
});

describe("checkIncongruence", () => {
  it("should return empty arr for empty input");
  it("should return empty arr when no incongruence detected");
  it("should detect heading nested deeper than its level suggests");
  it("should allow headings that return to shallower sections");
  it("should detect incongruence from README example");
});

// integration test —> i.e. HTML string in, full JSON out
describe("parseHTML", () => {
  it("should return empty arr's for no loaded HTML headings");
  it("should trim whitespace from header text/content");
  it("should give correct output (JSON) for specified README example");
});
