import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createProviders, type ProviderStatus } from "./providers/index.js";
import { registerWebSearch } from "./tools/webSearch.js";

export interface ServerContext {
  server: McpServer;
  providerStatus: ProviderStatus[];
}

export function createServer(): ServerContext {
  const { providers, status } = createProviders();
  const server = new McpServer(
    { name: "jupsearch-mcp", version: "0.1.0" },
    { instructions: "Self-hosted unified web search over configured providers." },
  );

  registerWebSearch(server, {
    providers,
    skipped: status.filter((item) => !item.configured).map((item) => item.name),
  });

  return { server, providerStatus: status };
}
