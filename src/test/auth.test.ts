import { describe, expect, it } from "vitest";
import { extractPresentedToken, readAuthToken, tokenMatches } from "../auth.js";

const TOKEN = "a".repeat(64);

describe("readAuthToken", () => {
  it("reads MCP_AUTH_TOKEN and trims it", () => {
    expect(readAuthToken(`  ${TOKEN}\n`)).toBe(TOKEN);
  });

  it("returns undefined when unset, empty or whitespace", () => {
    expect(readAuthToken(undefined)).toBeUndefined();
    expect(readAuthToken("")).toBeUndefined();
    expect(readAuthToken("   ")).toBeUndefined();
  });
});

describe("extractPresentedToken", () => {
  it("prefers the X-MCP-Token header", () => {
    expect(
      extractPresentedToken({ "x-mcp-token": TOKEN, authorization: "Bearer other" }),
    ).toBe(TOKEN);
  });

  it("accepts Authorization: Bearer", () => {
    expect(extractPresentedToken({ authorization: `Bearer ${TOKEN}` })).toBe(TOKEN);
    expect(extractPresentedToken({ authorization: `bearer ${TOKEN}` })).toBe(TOKEN);
  });

  it("returns undefined when no credential is presented", () => {
    expect(extractPresentedToken({})).toBeUndefined();
    expect(extractPresentedToken({ authorization: "Basic abc" })).toBeUndefined();
    expect(extractPresentedToken({ "x-mcp-token": "  " })).toBeUndefined();
  });

  it("does not echo a wrong-scheme Authorization value", () => {
    expect(extractPresentedToken({ authorization: "Bearer" })).toBeUndefined();
  });
});

describe("tokenMatches", () => {
  it("accepts the exact token", () => {
    expect(tokenMatches(TOKEN, TOKEN)).toBe(true);
  });

  it("rejects missing, different and prefix tokens", () => {
    expect(tokenMatches(TOKEN, undefined)).toBe(false);
    expect(tokenMatches(TOKEN, "b".repeat(64))).toBe(false);
    expect(tokenMatches(TOKEN, TOKEN.slice(0, 32))).toBe(false);
    expect(tokenMatches(TOKEN, `${TOKEN}x`)).toBe(false);
  });
});
