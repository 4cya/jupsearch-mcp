import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";
import { asArray, asRecord, asString, requestJson } from "./http.js";

interface FirecrawlResponse {
  data?: unknown;
  web?: unknown;
}

export class FirecrawlProvider implements SearchProvider {
  readonly name = "firecrawl" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    const data = await requestJson<FirecrawlResponse>(
      "https://api.firecrawl.dev/v2/search",
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ query, limit: options.maxResults }),
        signal: options.signal,
      },
    );

    const root = asRecord(data.data) ?? data;
    const items = Array.isArray(root.web) ? root.web : asArray(root.web);
    return items.flatMap((item): SearchResult[] => {
      const result = asRecord(item);
      const url = asString(result?.url);
      const title = asString(result?.title);
      if (!url || !title) return [];
      const snippet = asString(result?.description) ?? asString(result?.markdown);
      return [{ title, url, sources: [this.name], ...(snippet ? { snippet: snippet.slice(0, 500) } : {}) }];
    });
  }

  async fetch(url: string): Promise<string> {
    throw new Error(`firecrawl fetch is not implemented yet: ${url}`);
  }
}
