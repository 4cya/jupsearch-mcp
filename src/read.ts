import type { ProviderName, ReadKind, ReadProvider, ReadResult } from "./types.js";

export interface ReadFailure {
  provider: ProviderName;
  error: string;
}

export interface ReadOutcome {
  result?: ReadResult;
  attempted: ProviderName[];
  succeeded: ProviderName[];
  failed: ReadFailure[];
  skipped: ProviderName[];
}

export async function readWithFallback(
  providers: ReadProvider[],
  skipped: ProviderName[],
  url: string,
  kind: ReadKind,
  maxCharacters: number,
): Promise<ReadOutcome> {
  const attempted: ProviderName[] = [];
  const failed: ReadFailure[] = [];

  for (const provider of providers) {
    attempted.push(provider.name);
    try {
      const result = await provider.read(url, {
        kind,
        maxCharacters,
        signal: AbortSignal.timeout(30_000),
      });
      return { result, attempted, succeeded: [provider.name], failed, skipped };
    } catch (error) {
      failed.push({ provider: provider.name, error: errorMessage(error) });
    }
  }

  return { attempted, succeeded: [], failed, skipped };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
