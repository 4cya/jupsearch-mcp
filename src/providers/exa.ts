import type {
  ProviderSearchOptions,
  ReadProvider,
  ReadProviderOptions,
  ReadResult,
  SearchProvider,
  SearchResult,
} from "../types.js";
import { asArray, asNumber, asRecord, asString, requestJson } from "./http.js";

interface ExaResponse {
  results?: unknown;
}

interface ExaContentsResponse extends ExaResponse {}

export class ExaProvider implements SearchProvider, ReadProvider {
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

  async read(url: string, options: ReadProviderOptions): Promise<ReadResult> {
    const data = await requestJson<ExaContentsResponse>(
      "https://api.exa.ai/contents",
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": this.apiKey },
        body: JSON.stringify({ urls: [url], text: { maxCharacters: options.maxCharacters } }),
        signal: options.signal,
      },
    );
    const result = asRecord(asArray(data.results)[0]);
    const content = asString(result?.text);
    if (!content) throw new Error(`exa response missing results[0].text for ${url}`);

    const title = asString(result?.title);
    const resultUrl = asString(result?.url) ?? url;
    return {
      title,
      url: resultUrl,
      content,
      provider: this.name,
      kind: options.kind,
    };
  }
}
