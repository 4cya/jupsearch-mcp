import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { readPort } from "./config.js";
import { createServer } from "./server.js";

process.loadEnvFile?.();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  const { providerStatus } = createServer();
  res.json({
    status: "ok",
    providers: providerStatus.map(({ name, configured }) => ({ name, configured })),
  });
});

app.post("/mcp", async (req, res) => {
  const { server } = createServer();
  const transport = new StreamableHTTPServerTransport();

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.listen(readPort(), () => {
  console.log(`jupsearch-mcp listening on http://127.0.0.1:${readPort()}/mcp`);
});
