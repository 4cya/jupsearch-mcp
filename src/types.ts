export type ProviderName = "exa" | "serper" | "tavily" | "firecrawl" | "jina";

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedAt?: string;
  score?: number;
  sources: ProviderName[];
}

export interface ProviderSearchOptions {
  maxResults: number;
  signal: AbortSignal;
}

export interface SearchProvider {
  readonly name: ProviderName;
  search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]>;
  fetch(url: string): Promise<string>;
}
