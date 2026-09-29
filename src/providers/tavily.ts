import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";
import { asArray, asNumber, asRecord, asString, requestJson } from "./http.js";

interface TavilyResponse {
  results?: unknown;
}

export class TavilyProvider implements SearchProvider {
  readonly name = "tavily" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    const data = await requestJson<TavilyResponse>("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: options.maxResults,
        search_depth: "basic",
      }),
      signal: options.signal,
    });

    return asArray(data.results).flatMap((item): SearchResult[] => {
      const result = asRecord(item);
      const url = asString(result?.url);
      const title = asString(result?.title);
      if (!url || !title) return [];
      const snippet = asString(result?.content);
      const score = asNumber(result?.score);
      return [{
        title,
        url,
        sources: [this.name],
        ...(snippet ? { snippet } : {}),
        ...(score !== undefined ? { score } : {}),
      }];
    });
  }

}
