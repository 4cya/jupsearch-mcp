export type ProviderName = "exa" | "serper" | "tavily" | "firecrawl" | "jina";
export type ReadKind = "url" | "pdf" | "video";

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

export interface ReadProviderOptions {
  kind: ReadKind;
  maxCharacters: number;
  signal: AbortSignal;
}

export interface ReadResult {
  title?: string;
  url: string;
  content: string;
  provider: ProviderName;
  kind: ReadKind;
  warnings?: string[];
}

export interface SearchProvider {
  readonly name: ProviderName;
  search(query: string, options: ProviderSearchOptions): Promise<SearchResult[]>;
}

export interface ReadProvider {
  readonly name: ProviderName;
  read(url: string, options: ReadProviderOptions): Promise<ReadResult>;
}
