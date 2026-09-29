import { describe, expect, it } from "vitest";
import { readApiKey, readProviderOrder, searchProviderOrder } from "../config.js";

describe("searchProviderOrder", () => {
  it("parses the configured provider order", () => {
    expect(searchProviderOrder("serper, exa,tavily")).toEqual(["serper", "exa", "tavily"]);
  });

  it("ignores unknown providers", () => {
    expect(searchProviderOrder("exa,bogus,serper")).toEqual(["exa", "serper"]);
  });

  it("treats missing and blank keys as unconfigured", () => {
    delete process.env.EXA_API_KEY;
    expect(readApiKey("exa")).toBeUndefined();
    process.env.EXA_API_KEY = "   ";
    expect(readApiKey("exa")).toBeUndefined();
  });
});

describe("readProviderOrder", () => {
  it("defaults to firecrawl, exa, jina and rejects search-only providers", () => {
    expect(readProviderOrder("")).toEqual(["firecrawl", "exa", "jina"]);
    expect(readProviderOrder("serper,exa,jina")).toEqual(["exa", "jina"]);
  });
});
