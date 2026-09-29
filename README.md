# jupsearch-mcp

自托管的统一搜索 MCP Server。当前版本提供 `web_search`，通过 Exa、Serper、Tavily、Firecrawl、Jina 多渠道检索并用 RRF 融合结果。

## 要求

- Node.js 24+
- npm

## 配置

```bash
cp .env.example .env
```

`SEARCH_PROVIDERS` 决定渠道顺序。未设置 key 的渠道会被跳过，单个渠道失败不会影响其他渠道。

## 本地运行

```bash
npm install
npm run build
npm start
```

服务默认监听 `http://127.0.0.1:8790/mcp`，健康检查为 `GET /health`。

## 测试

```bash
npm test
```

## MCP 客户端配置

Streamable HTTP 地址：

```text
http://127.0.0.1:8790/mcp
```

`web_search` 参数：

- `query`：必填，搜索词
- `max_results`：可选，返回结果上限，1-20，默认 10

返回结果包含 `results`、`attempted`、`succeeded`、`failed`、`skipped`；每条结果通过 `sources` 保留渠道溯源。

## 渠道

| 渠道 | 搜索端点 |
| --- | --- |
| exa | `https://api.exa.ai/search` |
| serper | `https://google.serper.dev/search` |
| tavily | `https://api.tavily.com/search` |
| firecrawl | `https://api.firecrawl.dev/v2/search` |
| jina | `https://s.jina.ai/` |

## License

MIT
