# jupsearch-mcp

自托管的统一搜索与内容抽取 MCP Server。提供 `web_search`、`read_url`、`extract_pdf`、`read_video` 四个工具，通过 Exa、Serper、Tavily、Firecrawl、Jina 多渠道检索，并用 RRF 融合搜索结果。

## 要求

- Node.js 24+
- npm

## 配置

```bash
cp .env.example .env
```

`SEARCH_PROVIDERS` 决定搜索渠道顺序，`READ_PROVIDERS` 决定网页/PDF 读取渠道顺序。未设置 key 的渠道会被跳过，单个渠道失败不会影响其他渠道。

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

### read_url

抓取公开网页并返回 Markdown。渠道链默认 `firecrawl,exa,jina`，即 `READ_PROVIDERS` 的值。

- `url`：必填，公开网页地址
- `max_characters`：可选，返回内容上限，1-100000，默认 20000

### extract_pdf

抽取公开 PDF 的文本并返回 Markdown。请求参数和渠道链与 `read_url` 相同。

### read_video

抽取视频页面的标题、描述、章节等可见内容。渠道链固定为 `jina,firecrawl`，不受 `READ_PROVIDERS` 控制。

本工具不提供字幕或音视频转写：上游渲染、站点鉴权或渠道能力可能使字幕不可得，返回中的 `warnings` 会如实标注原因，不伪造字幕。引入 yt-dlp / ffmpeg 等额外系统依赖不在当前范围。

三个读取工具均返回 `result`、`attempted`、`succeeded`、`failed`、`skipped`。`result` 包含 `title`、`url`、`content`、`provider`、`kind` 和可选的 `warnings`。

## 渠道

| 渠道 | 搜索端点 | 读取端点 |
| --- | --- | --- |
| exa | `https://api.exa.ai/search` | `https://api.exa.ai/contents` |
| serper | `https://google.serper.dev/search` | - |
| tavily | `https://api.tavily.com/search` | - |
| firecrawl | `https://api.firecrawl.dev/v2/search` | `https://api.firecrawl.dev/v2/scrape` |
| jina | `https://s.jina.ai/` | `https://r.jina.ai/` |

## License

MIT
