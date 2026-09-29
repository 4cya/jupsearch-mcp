import { readApiKey, readProviderOrder, searchProviderOrder } from "../config.js";
import type { ProviderName, ReadProvider, SearchProvider } from "../types.js";
import { ExaProvider } from "./exa.js";
import { FirecrawlProvider } from "./firecrawl.js";
import { JinaProvider } from "./jina.js";
import { SerperProvider } from "./serper.js";
import { TavilyProvider } from "./tavily.js";

export interface ProviderStatus {
  name: ProviderName;
  configured: boolean;
}

export function createProviders(): { providers: SearchProvider[]; status: ProviderStatus[] } {
  const providers: SearchProvider[] = [];
  const status: ProviderStatus[] = [];

  for (const name of searchProviderOrder()) {
    const key = readApiKey(name);
    status.push({ name, configured: Boolean(key) });
    if (!key) continue;
    providers.push(createProvider(name, key));
  }

  return { providers, status };
}

export function createReadProviders(
  order = readProviderOrder(),
): { providers: ReadProvider[]; status: ProviderStatus[] } {
  const providers: ReadProvider[] = [];
  const status: ProviderStatus[] = [];

  for (const name of order) {
    const key = readApiKey(name);
    status.push({ name, configured: Boolean(key) });
    if (!key) continue;
    providers.push(createReadProvider(name, key));
  }

  return { providers, status };
}

function createProvider(name: ProviderName, apiKey: string): SearchProvider {
  switch (name) {
    case "exa":
      return new ExaProvider(apiKey);
    case "serper":
      return new SerperProvider(apiKey);
    case "tavily":
      return new TavilyProvider(apiKey);
    case "firecrawl":
      return new FirecrawlProvider(apiKey);
    case "jina":
      return new JinaProvider(apiKey);
  }
}

function createReadProvider(name: ProviderName, apiKey: string): ReadProvider {
  switch (name) {
    case "exa":
      return new ExaProvider(apiKey);
    case "firecrawl":
      return new FirecrawlProvider(apiKey);
    case "jina":
      return new JinaProvider(apiKey);
    case "serper":
    case "tavily":
      throw new Error(`provider does not support read: ${name}`);
  }
}
