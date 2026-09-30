import { timingSafeEqual } from "node:crypto";

/**
 * 固定 token 鉴权。
 *
 * token 只从环境变量 `MCP_AUTH_TOKEN` 读取（部署环境里由 systemd 的
 * EnvironmentFile=/opt/jupsearch-mcp/.env 提供，明文同时留存在服务器的
 * /opt/jupsearch-mcp/.mcp-token，权限 600）。代码、仓库、日志里都不含 token。
 */

/** 客户端可直接发送该请求头；也接受 `Authorization: Bearer <token>`。 */
export const AUTH_TOKEN_HEADER = "x-mcp-token";

export function readAuthToken(value = process.env.MCP_AUTH_TOKEN): string | undefined {
  const token = value?.trim();
  return token || undefined;
}

/** 从请求头中取出客户端出示的 token（X-MCP-Token 优先，其次 Bearer）。 */
export function extractPresentedToken(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const direct = headers[AUTH_TOKEN_HEADER];
  const directValue = Array.isArray(direct) ? direct[0] : direct;
  if (directValue?.trim()) return directValue.trim();

  const authorization = headers.authorization;
  const authorizationValue = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = authorizationValue ? /^Bearer\s+(.+)$/i.exec(authorizationValue.trim()) : null;
  return match?.[1]?.trim() || undefined;
}

/** 定长常量时间比较，避免通过响应时间泄漏 token 内容。 */
export function tokenMatches(expected: string, presented: string | undefined): boolean {
  if (!presented) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const presentedBuffer = Buffer.from(presented, "utf8");
  if (expectedBuffer.length !== presentedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, presentedBuffer);
}
