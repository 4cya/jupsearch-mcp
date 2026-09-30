# 安全策略

## 支持版本

| 版本 | 支持状态 |
| --- | --- |
| `v0.1.x` | 接收安全修复 |
| `< v0.1.0` | 不再支持 |

## 报告漏洞

请**不要**通过公开 issue 报告安全漏洞。

- **首选**：GitHub Security Advisories（私密提交，仅维护者可见）
  https://github.com/4cya/jupsearch-mcp/security/advisories/new
- **备选**：邮件联系维护者 `zzj1213@qq.com`

报告请尽量包含：受影响版本、复现步骤、影响面、以及可能的修复方向（如有）。

## 响应承诺

- 3 个工作日内确认收到报告
- 确认有效后 14 天内给出修复计划或缓解措施
- 修复发布后，经报告者同意在 Release notes 或 Security Advisory 中致谢

## 部署侧注意

本项目持有付费渠道的 API key，部署时请注意：

- 服务默认只监听 `127.0.0.1`，对外暴露请置于 HTTPS 反向代理之后
- `/mcp` 需要配置 `MCP_AUTH_TOKEN`（**fail closed**：未配置时一律返回 503，不会退回无鉴权模式）
- 渠道 API key 与 token 只从环境变量 / `.env` 读取，请勿提交进仓库，并确保 `.env` 权限为 600
- `GET /health` 免鉴权，仅返回渠道名与 `configured` 布尔值，不含任何凭据
