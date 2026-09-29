import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readWithFallback } from "../read.js";
import type { ProviderName, ReadProvider } from "../types.js";

export interface ReadToolDeps {
  providers: ReadProvider[];
  skipped: ProviderName[];
  videoProviders?: ReadProvider[];
  videoSkipped?: ProviderName[];
}

export function registerReadTools(server: McpServer, deps: ReadToolDeps): void {
  registerReadTool(server, "read_url", "Read a web page as markdown.", deps, "url");
  registerReadTool(server, "extract_pdf", "Extract text from a PDF as markdown.", deps, "pdf");
  registerReadTool(
    server,
    "read_video",
    "Read a video page. Transcript availability depends on upstream rendering and site authentication.",
    {
      providers: deps.videoProviders ?? [],
      skipped: deps.videoSkipped ?? [],
    },
    "video",
  );
}

function registerReadTool(
  server: McpServer,
  name: "read_url" | "extract_pdf" | "read_video",
  description: string,
  deps: ReadToolDeps,
  kind: "url" | "pdf" | "video",
): void {
  server.registerTool(
    name,
    {
      title: name,
      description,
      inputSchema: {
        url: z.string().url().describe("Public URL to read"),
        max_characters: z.number().int().min(1).max(100_000).optional().describe("Maximum content length"),
      },
    },
    async ({ url, max_characters }) => {
      const outcome = await readWithFallback(
        deps.providers,
        deps.skipped,
        url,
        kind,
        max_characters ?? 20_000,
      );

      if (kind === "video" && outcome.result) {
        outcome.result = {
          ...outcome.result,
          warnings: [
            ...(outcome.result.warnings ?? []),
            "Transcript unavailable: this response contains only video-page content. The upstream reader did not render a transcript or the site required authentication.",
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(outcome, null, 2) }],
        structuredContent: outcome as unknown as Record<string, unknown>,
        ...(outcome.result ? {} : { isError: true }),
      };
    },
  );
}
