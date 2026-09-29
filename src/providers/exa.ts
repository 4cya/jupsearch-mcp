import type { ProviderSearchOptions, SearchProvider, SearchResult } from "../types.js";
import { asArray, asNumber, asRecord, asString, requestJson } from "./http.js";

interface ExaResponse {
  results?: unknown;
}

export class ExaProvider implements SearchProvider {
  readonly name = "exa" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]> {
    const data = await requestJson<ExaResponse>(
      "https://api.exa.ai/search",
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": this.apiKey },
        body: JSON.stringify({ query, numResults: options.maxResults, contents: { text: { maxCharacters: 500 } } }),
        signal: options.signal,
      },
    );

    return asArray(data.results).flatMap((item): SearchResult[] => {
      const result = asRecord(item);
      const url = asString(result?.url);
      const title = asString(result?.title);
      if (!url || !title) return [];
      const text = asString(result?.text);
      const publishedAt = asString(result?.publishedDate);
      const score = asNumber(result?.score);
      return [{
        title,
        url,
        sources: [this.name],
        ...(text ? { snippet: text } : {}),
        ...(publishedAt ? { publishedAt } : {}),
        ...(score !== undefined ? { score } : {}),
      }];
    });
  }

  async fetch(url: string): Promise<string> {
    throw new Error(`exa fetch is not implemented yet: ${url}`);
  }
}
