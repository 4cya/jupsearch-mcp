import type { SearchResult } from "../types.js";

const RRF_K = 60;

export function reciprocalRankFusion(
  rankedLists: SearchResult[][],
  limit = Number.POSITIVE_INFINITY,
): SearchResult[] {
  const merged = new Map<string, { result: SearchResult; score: number }>();

  for (const list of rankedLists) {
    const seen = new Set<string>();
    list.forEach((result, index) => {
      const key = normalizeUrl(result.url);
      if (seen.has(key)) return;
      seen.add(key);

      const existing = merged.get(key);
      const score = 1 / (RRF_K + index + 1);
      if (existing) {
        existing.score += score;
        for (const source of result.sources) {
          if (!existing.result.sources.includes(source)) existing.result.sources.push(source);
        }
        existing.result = { ...existing.result, ...pickMissing(existing.result, result) };
      } else {
        merged.set(key, { result: { ...result, sources: [...result.sources] }, score });
      }
    });
  }

  return [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result, score }) => ({ ...result, score: Number(score.toFixed(6)) }));
}

function pickMissing(base: SearchResult, candidate: SearchResult): Partial<SearchResult> {
  const patch: Partial<SearchResult> = {};
  if (!base.snippet && candidate.snippet) patch.snippet = candidate.snippet;
  if (!base.publishedAt && candidate.publishedAt) patch.publishedAt = candidate.publishedAt;
  if (!base.title && candidate.title) patch.title = candidate.title;
  return patch;
}

export function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}
