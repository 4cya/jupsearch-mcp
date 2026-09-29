import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "../fusion/rrf.js";
import type { SearchResult } from "../types.js";

function result(url: string, title = url, source: "exa" | "serper" = "exa"): SearchResult {
  return { title, url, sources: [source] };
}

describe("reciprocalRankFusion", () => {
  it("ranks documents appearing high in both lists first", () => {
    const fused = reciprocalRankFusion([
      [result("https://a.test", "A"), result("https://b.test", "B")],
      [result("https://a.test", "A", "serper"), result("https://c.test", "C", "serper")],
    ]);

    expect(fused[0]?.url).toBe("https://a.test");
    expect(fused[0]?.sources).toEqual(["exa", "serper"]);
  });

  it("deduplicates trailing slashes and fragments", () => {
    const fused = reciprocalRankFusion([
      [result("https://a.test/")],
      [result("https://a.test/#section", "A", "serper")],
    ]);

    expect(fused).toHaveLength(1);
    expect(fused[0]?.sources).toEqual(["exa", "serper"]);
  });
});
