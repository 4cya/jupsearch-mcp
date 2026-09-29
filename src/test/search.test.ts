import { describe, expect, it } from "vitest";
import { searchAll } from "../search.js";
import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";

class FakeProvider implements SearchProvider {
  constructor(
    readonly name: "exa" | "serper" | "tavily",
    private readonly behavior: "ok" | "fail",
  ) {}

  async search(_query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    void options;
    if (this.behavior === "fail") throw new Error(`${this.name} quota exceeded`);
    return [{ title: `${this.name} result`, url: `https://${this.name}.test`, sources: [this.name] }];
  }

  async fetch(url: string): Promise<string> {
    return url;
  }
}

describe("searchAll", () => {
  it("keeps successful providers when another provider fails", async () => {
    const outcome = await searchAll(
      [new FakeProvider("exa", "ok"), new FakeProvider("serper", "fail")],
      ["tavily"],
      "test",
      10,
    );

    expect(outcome.succeeded).toEqual(["exa"]);
    expect(outcome.failed).toEqual([{ provider: "serper", error: "serper quota exceeded" }]);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.skipped).toEqual(["tavily"]);
  });
});
