import { afterEach, describe, expect, it, vi } from "vitest";
import { ExaProvider } from "../providers/exa.js";
import { FirecrawlProvider } from "../providers/firecrawl.js";
import { JinaProvider } from "../providers/jina.js";
import { createReadProviders } from "../providers/index.js";

const keys = ["EXA_API_KEY", "FIRECRAWL_API_KEY", "JINA_API_KEY"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  vi.restoreAllMocks();
});

describe("createReadProviders", () => {
  it("skips providers without keys and accepts only read providers", () => {
    process.env.EXA_API_KEY = "exa-test-key";
    delete process.env.FIRECRAWL_API_KEY;
    process.env.JINA_API_KEY = " ";

    const { providers, status } = createReadProviders(["firecrawl", "exa", "jina"]);

    expect(providers.map((provider) => provider.name)).toEqual(["exa"]);
    expect(status).toEqual([
      { name: "firecrawl", configured: false },
      { name: "exa", configured: true },
      { name: "jina", configured: false },
    ]);
  });
});

describe("read adapters", () => {
  it("parses Exa contents text", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({
      results: [{ title: "Example", url: "https://example.com", text: "Exa markdown" }],
    })));

    const result = await new ExaProvider("test-key").read("https://example.com", {
      kind: "url",
      maxCharacters: 1_000,
      signal: AbortSignal.timeout(1_000),
    });

    expect(result).toMatchObject({ title: "Example", content: "Exa markdown", provider: "exa" });
  });

  it("parses Firecrawl scrape markdown", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({
      data: { markdown: "Firecrawl markdown", metadata: { title: "Example", url: "https://example.com" } },
    })));

    const result = await new FirecrawlProvider("test-key").read("https://example.com", {
      kind: "url",
      maxCharacters: 1_000,
      signal: AbortSignal.timeout(1_000),
    });

    expect(result).toMatchObject({ title: "Example", content: "Firecrawl markdown", provider: "firecrawl" });
  });

  it("parses Jina markdown and preserves upstream warnings", async () => {
    vi.stubGlobal("fetch", async () => new Response([
      "Title: Example",
      "Warning: Target URL returned error 401: Unauthorized",
      "Markdown Content:",
      "Video page text",
    ].join("\n")));

    const result = await new JinaProvider("test-key").read("https://example.com", {
      kind: "video",
      maxCharacters: 1_000,
      signal: AbortSignal.timeout(1_000),
    });

    expect(result.title).toBe("Example");
    expect(result.content).toBe("Video page text");
    expect(result.warnings).toEqual(["Target URL returned error 401: Unauthorized"]);
  });

  it("does not invent a Jina warning when the title is present", async () => {
    vi.stubGlobal("fetch", async () => new Response("Title: Example\nMarkdown Content:\nPage text"));

    const result = await new JinaProvider("test-key").read("https://example.com", {
      kind: "url",
      maxCharacters: 1_000,
      signal: AbortSignal.timeout(1_000),
    });

    expect(result.warnings).toBeUndefined();
  });
});
