import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";
import { asArray, asRecord, asString, requestJson } from "./http.js";

interface SerperResponse {
  organic?: unknown;
}

export class SerperProvider implements SearchProvider {
  readonly name = "serper" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    const data = await requestJson<SerperResponse>(
      "https://google.serper.dev/search",
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": this.apiKey },
        body: JSON.stringify({ q: query, num: options.maxResults }),
        signal: options.signal,
      },
    );

    return asArray(data.organic).flatMap((item): SearchResult[] => {
      const result = asRecord(item);
      const url = asString(result?.link);
      const title = asString(result?.title);
      if (!url || !title) return [];
      const snippet = asString(result?.snippet);
      return [{ title, url, sources: [this.name], ...(snippet ? { snippet } : {}) }];
    });
  }

}
