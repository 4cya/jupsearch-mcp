import { describe, expect, it } from "vitest";
import { readApiKey, readProviderOrder } from "../config.js";

describe("readProviderOrder", () => {
  it("parses the configured provider order", () => {
    expect(readProviderOrder("serper, exa,tavily")).toEqual(["serper", "exa", "tavily"]);
  });

  it("ignores unknown providers", () => {
    expect(readProviderOrder("exa,bogus,serper")).toEqual(["exa", "serper"]);
  });

  it("treats missing and blank keys as unconfigured", () => {
    delete process.env.EXA_API_KEY;
    expect(readApiKey("exa")).toBeUndefined();
    process.env.EXA_API_KEY = "   ";
    expect(readApiKey("exa")).toBeUndefined();
  });
});
