import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { extractPresentedToken, readAuthToken, tokenMatches } from "./auth.js";
import { readHost, readPort } from "./config.js";
import { createServer } from "./server.js";

process.loadEnvFile?.();

const authToken = readAuthToken();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  const { providerStatus } = createServer();
  res.json({
    status: "ok",
    providers: providerStatus.map(({ name, configured }) => ({ name, configured })),
  });
});

// 固定 token 鉴权：只保护 /mcp。/health 仅返回渠道名与 configured 布尔值，不含凭据。
app.use("/mcp", (req, res, next) => {
  if (!authToken) {
    res.status(503).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "MCP_AUTH_TOKEN is not configured; /mcp is disabled." },
      id: null,
    });
    return;
  }

  if (!tokenMatches(authToken, extractPresentedToken(req.headers))) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Unauthorized: send the token via the X-MCP-Token header.",
      },
      id: null,
    });
    return;
  }

  next();
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

const host = readHost();
const port = readPort();

app.listen(port, host, () => {
  console.log(`jupsearch-mcp listening on http://${host}:${port}/mcp`);
  if (!authToken) {
    console.warn("MCP_AUTH_TOKEN is not set: /mcp requests are rejected with 503.");
  }
});
