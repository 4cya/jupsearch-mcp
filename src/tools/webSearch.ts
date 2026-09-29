import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchAll } from "../search.js";
import type { ProviderName, SearchProvider } from "../types.js";

export interface WebSearchDeps {
  providers: SearchProvider[];
  skipped: ProviderName[];
}

export function registerWebSearch(server: McpServer, deps: WebSearchDeps): void {
  server.registerTool(
    "web_search",
    {
      title: "Web search",
      description: "Search the web through the configured providers and fuse the results.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        max_results: z.number().int().min(1).max(20).optional().describe("Maximum fused results"),
      },
    },
    async ({ query, max_results }) => {
      const outcome = await searchAll(
        deps.providers,
        deps.skipped,
        query,
        max_results ?? 10,
      );

      return {
        content: [{ type: "text", text: JSON.stringify(outcome, null, 2) }],
        structuredContent: outcome as unknown as Record<string, unknown>,
      };
    },
  );
}
