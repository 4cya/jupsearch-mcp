import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";
import { asArray, asRecord, asString, requestJson } from "./http.js";

interface JinaResponse {
  data?: unknown;
}

export class JinaProvider implements SearchProvider {
  readonly name = "jina" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    const url = new URL("https://s.jina.ai/");
    url.searchParams.set("q", query);
    const data = await requestJson<JinaResponse>(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.apiKey}`,
        "x-respond-with": "json",
      },
      signal: options.signal,
    });

    return asArray(data.data).slice(0, options.maxResults).flatMap((item): SearchResult[] => {
      const result = asRecord(item);
      const urlValue = asString(result?.url);
      const title = asString(result?.title);
      if (!urlValue || !title) return [];
      const snippet = asString(result?.content) ?? asString(result?.description);
      return [{ title, url: urlValue, sources: [this.name], ...(snippet ? { snippet: snippet.slice(0, 500) } : {}) }];
    });
  }

  async fetch(url: string): Promise<string> {
    throw new Error(`jina fetch is not implemented yet: ${url}`);
  }
}
