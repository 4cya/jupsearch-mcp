import type {
  ProviderSearchOptions,
  ReadProvider,
  ReadProviderOptions,
  ReadResult,
  SearchProvider,
  SearchResult,
} from "../types.js";
import { asArray, asRecord, asString, requestJson } from "./http.js";

interface FirecrawlResponse {
  data?: unknown;
  web?: unknown;
}

interface FirecrawlScrapeResponse {
  data?: unknown;
}

export class FirecrawlProvider implements SearchProvider, ReadProvider {
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

  async read(url: string, options: ReadProviderOptions): Promise<ReadResult> {
    const data = await requestJson<FirecrawlScrapeResponse>(
      "https://api.firecrawl.dev/v2/scrape",
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
        signal: options.signal,
      },
    );
    const result = asRecord(data.data);
    const content = asString(result?.markdown);
    if (!content) throw new Error(`firecrawl response missing data.markdown for ${url}`);

    const metadata = asRecord(result?.metadata);
    const title = asString(metadata?.title);
    return {
      title,
      url: asString(metadata?.url) ?? url,
      content: content.slice(0, options.maxCharacters),
      provider: this.name,
      kind: options.kind,
    };
  }
}
