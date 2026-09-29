import { afterEach, describe, expect, it } from "vitest";
import { createProviders, createReadProviders } from "../providers/index.js";

const keys = ["EXA_API_KEY", "SERPER_API_KEY", "TAVILY_API_KEY", "FIRECRAWL_API_KEY", "JINA_API_KEY"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("createProviders", () => {
  it("skips providers without keys and preserves configured order", () => {
    process.env.SEARCH_PROVIDERS = "exa,serper,tavily";
    process.env.EXA_API_KEY = "";
    process.env.SERPER_API_KEY = "serper-test-key";
    delete process.env.TAVILY_API_KEY;

    const { providers, status } = createProviders();

    expect(providers.map((provider) => provider.name)).toEqual(["serper"]);
    expect(status).toEqual([
      { name: "exa", configured: false },
      { name: "serper", configured: true },
      { name: "tavily", configured: false },
    ]);
  });
});

describe("createReadProviders", () => {
  it("keeps the read chain independent from the search chain", () => {
    process.env.SEARCH_PROVIDERS = "serper,tavily";
    process.env.READ_PROVIDERS = "firecrawl,exa,jina";
    process.env.FIRECRAWL_API_KEY = "";
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.JINA_API_KEY = "";

    const { providers, status } = createReadProviders();

    expect(providers.map((provider) => provider.name)).toEqual(["exa"]);
    expect(status.map((item) => item.name)).toEqual(["firecrawl", "exa", "jina"]);
  });
});
