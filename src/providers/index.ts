import { readApiKey, readProviderOrder } from "../config.js";
import type { ProviderName, SearchProvider } from "../types.js";
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

  for (const name of readProviderOrder()) {
    const key = readApiKey(name);
    status.push({ name, configured: Boolean(key) });
    if (!key) continue;
    providers.push(createProvider(name, key));
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
