import type { ProviderName } from "./types.js";

const DEFAULT_PROVIDERS: ProviderName[] = ["exa", "serper", "tavily", "jina", "firecrawl"];
const PROVIDER_NAMES = new Set<string>(DEFAULT_PROVIDERS);
const READ_PROVIDER_NAMES = new Set<string>(["firecrawl", "exa", "jina"]);
const DEFAULT_READ_PROVIDERS: ProviderName[] = ["firecrawl", "exa", "jina"];

export const VIDEO_READ_PROVIDERS: ProviderName[] = ["jina", "firecrawl"];

export function searchProviderOrder(value = process.env.SEARCH_PROVIDERS): ProviderName[] {
  if (!value?.trim()) return DEFAULT_PROVIDERS;

  return value
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name): name is ProviderName => PROVIDER_NAMES.has(name));
}

export function readProviderOrder(value = process.env.READ_PROVIDERS): ProviderName[] {
  if (!value?.trim()) return [...DEFAULT_READ_PROVIDERS];

  return value
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name): name is ProviderName => READ_PROVIDER_NAMES.has(name));
}

export function readApiKey(provider: ProviderName): string | undefined {
  const key = process.env[`${provider.toUpperCase()}_API_KEY`]?.trim();
  return key || undefined;
}

export function readHost(value = process.env.HOST): string {
  const host = value?.trim();
  return host || "127.0.0.1";
}

export function readPort(value = process.env.PORT): number {
  const port = Number(value ?? 8790);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`invalid PORT: ${value}`);
  }
  return port;
}
