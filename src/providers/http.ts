export async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 15_000,
): Promise<T> {
  const response = await request(url, init, timeoutMs);
  return (await response.json()) as T;
}

export async function requestText(
  url: string,
  init: RequestInit,
  timeoutMs = 15_000,
): Promise<string> {
  const response = await request(url, init, timeoutMs);
  return response.text();
}

async function request(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
