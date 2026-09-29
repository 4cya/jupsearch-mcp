import type { ProviderName, SearchProvider, SearchResult } from "./types.js";
import { reciprocalRankFusion } from "./fusion/rrf.js";

export interface SearchOutcome {
  results: SearchResult[];
  attempted: ProviderName[];
  succeeded: ProviderName[];
  failed: Array<{ provider: ProviderName; error: string }>;
  skipped: ProviderName[];
}

export async function searchAll(
  providers: SearchProvider[],
  skipped: ProviderName[],
  query: string,
  maxResults: number,
): Promise<SearchOutcome> {
  const attempted = providers.map((provider) => provider.name);
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.search(query, { maxResults, signal: AbortSignal.timeout(15_000) })),
  );

  const lists: SearchResult[][] = [];
  const succeeded: ProviderName[] = [];
  const failed: Array<{ provider: ProviderName; error: string }> = [];

  settled.forEach((outcome, index) => {
    const provider = providers[index];
    if (!provider) return;
    if (outcome.status === "fulfilled") {
      succeeded.push(provider.name);
      lists.push(outcome.value);
    } else {
      failed.push({ provider: provider.name, error: errorMessage(outcome.reason) });
    }
  });

  return {
    results: reciprocalRankFusion(lists, maxResults),
    attempted,
    succeeded,
    failed,
    skipped,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
