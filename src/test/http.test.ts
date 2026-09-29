import { describe, expect, it } from "vitest";
import { requestJson } from "../providers/http.js";

describe("requestJson", () => {
  it("reports HTTP status and body without echoing request headers", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "invalid key" }), { status: 401 });

    try {
      await expect(
        requestJson("https://example.test", {
          headers: { authorization: "Bearer super-secret-key" },
        }),
      ).rejects.toThrow('HTTP 401: {"error":"invalid key"}');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
