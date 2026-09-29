import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VIDEO_READ_PROVIDERS } from "./config.js";
import { createProviders, createReadProviders, type ProviderStatus } from "./providers/index.js";
import { registerReadTools } from "./tools/readUrl.js";
import { registerWebSearch } from "./tools/webSearch.js";

export interface ServerContext {
  server: McpServer;
  providerStatus: ProviderStatus[];
}

export function createServer(): ServerContext {
  const { providers, status } = createProviders();
  const read = createReadProviders();
  const video = createReadProviders(VIDEO_READ_PROVIDERS);
  const server = new McpServer(
    { name: "jupsearch-mcp", version: "0.1.0" },
    { instructions: "Self-hosted unified web search over configured providers." },
  );

  registerWebSearch(server, {
    providers,
    skipped: status.filter((item) => !item.configured).map((item) => item.name),
  });

  registerReadTools(server, {
    providers: read.providers,
    skipped: read.status.filter((item) => !item.configured).map((item) => item.name),
    videoProviders: video.providers,
    videoSkipped: video.status.filter((item) => !item.configured).map((item) => item.name),
  });

  return { server, providerStatus: status };
}
