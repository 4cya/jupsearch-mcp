import type {
  ProviderSearchOptions,
  ReadProvider,
  ReadProviderOptions,
  ReadResult,
  SearchProvider,
  SearchResult,
} from "../types.js";
import { asArray, asRecord, asString, requestJson, requestText } from "./http.js";

interface JinaResponse {
  data?: unknown;
}

export class JinaProvider implements SearchProvider, ReadProvider {
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

  async read(url: string, options: ReadProviderOptions): Promise<ReadResult> {
    const text = await requestText(`https://r.jina.ai/${url}`, {
      method: "GET",
      headers: {
        accept: "text/plain",
        authorization: `Bearer ${this.apiKey}`,
      },
      signal: options.signal,
    });
    const parsed = parseJinaResponse(text, url);
    if (!parsed.content) throw new Error(`jina response missing Markdown Content for ${url}`);

    return {
      title: parsed.title,
      url,
      content: parsed.content.slice(0, options.maxCharacters),
      provider: this.name,
      kind: options.kind,
      warnings: parsed.warnings.length ? parsed.warnings : undefined,
    };
  }
}

function parseJinaResponse(value: string, url: string): { title?: string; content: string; warnings: string[] } {
  const text = value.replace(/^\uFEFF/, "").trim();
  const marker = "Markdown Content:";
  const markerIndex = text.indexOf(marker);
  const header = markerIndex >= 0 ? text.slice(0, markerIndex) : "";
  const content = (markerIndex >= 0 ? text.slice(markerIndex + marker.length) : text).trim();
  const title = header.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
  const warnings = [...header.matchAll(/^Warning:\s*(.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((warning): warning is string => Boolean(warning));
  if (!title) warnings.push(`Jina Reader returned a response without a title for ${url}`);

  return { title, content, warnings };
}
