import { describe, expect, it, vi } from "vitest";
import { readWithFallback } from "../read.js";
import type { ReadProvider, ReadProviderOptions, ReadResult } from "../types.js";

class FakeReadProvider implements ReadProvider {
  constructor(
    readonly name: "firecrawl" | "exa" | "jina",
    private readonly behavior: "ok" | "fail",
  ) {}

  async read(url: string, options: ReadProviderOptions): Promise<ReadResult> {
    if (this.behavior === "fail") throw new Error(`${this.name} unavailable`);
    return {
      title: "Example",
      url,
      content: `${this.name} content`,
      provider: this.name,
      kind: options.kind,
    };
  }
}

describe("readWithFallback", () => {
  it("falls back when an earlier provider fails", async () => {
    const outcome = await readWithFallback(
      [new FakeReadProvider("firecrawl", "fail"), new FakeReadProvider("exa", "ok")],
      ["jina"],
      "https://example.com",
      "url",
      1_000,
    );

    expect(outcome.result?.provider).toBe("exa");
    expect(outcome.attempted).toEqual(["firecrawl", "exa"]);
    expect(outcome.succeeded).toEqual(["exa"]);
    expect(outcome.failed).toEqual([{ provider: "firecrawl", error: "firecrawl unavailable" }]);
    expect(outcome.skipped).toEqual(["jina"]);
  });

  it("does not log API keys when a provider fails", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const key = "super-secret-read-key";
    const provider: ReadProvider = {
      name: "exa",
      async read(): Promise<ReadResult> {
        throw new Error("upstream unavailable");
      },
    };

    await readWithFallback([provider], [], `https://example.com?key=${key}`, "url", 1_000);

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
