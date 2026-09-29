import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerReadTools } from "../tools/readUrl.js";
import type { ReadProvider, ReadProviderOptions, ReadResult } from "../types.js";

class StaticReadProvider implements ReadProvider {
  constructor(
    readonly name: "exa" | "jina",
    private readonly content: string,
  ) {}

  async read(url: string, options: ReadProviderOptions): Promise<ReadResult> {
    return {
      url,
      content: this.content.slice(0, options.maxCharacters),
      provider: this.name,
      kind: options.kind,
    };
  }
}

describe("registerReadTools", () => {
  it("registers the three read tools and annotates video transcript limitations", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerReadTools(server, {
      providers: [new StaticReadProvider("exa", "web content")],
      skipped: [],
      videoProviders: [new StaticReadProvider("jina", "video page content")],
      videoSkipped: [],
    });

    const registered = server as unknown as {
      _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }>;
    };
    expect(Object.keys(registered._registeredTools)).toEqual(["read_url", "extract_pdf", "read_video"]);

    const response = await registered._registeredTools.read_video?.handler({
      url: "https://www.youtube.com/watch?v=test",
      max_characters: 100,
    });
    const outcome = (response as { structuredContent: { result: { warnings: string[] } } }).structuredContent;
    expect(outcome.result.warnings[0]).toContain("Transcript unavailable");
  });
});
