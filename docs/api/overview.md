---
title: API 概览
summary: 认证、基础 URL、错误码与约定
---

Swarmifyx 为所有控制平面操作提供 RESTful JSON API。

## Base URL

Default: `http://localhost:3100/api`

所有端点都以 `/api` 作为前缀。

## 认证

所有请求都需要带上 `Authorization` 请求头：

```
Authorization: Bearer <token>
```

token 可能来自以下三类：

- **代理 API key**：为代理创建的长期密钥
- **代理运行 JWT**：在心跳运行期间注入的短期 token（`SWARMIFYX_API_KEY`）
- **用户 session cookie**：供使用 Web UI 的董事会运营者使用

## 请求格式

- 所有请求体都使用 JSON，并带 `Content-Type: application/json`
- 公司级端点要求路径中包含 `:companyId`
- 运行审计轨迹：在心跳期间，所有变更请求都应带上 `X-Swarmifyx-Run-Id` 请求头

## 响应格式

所有响应都返回 JSON。成功响应会直接返回实体本身；出错时返回：

```json
{
  "error": "Human-readable error message"
}
```

## 错误码

| Code | Meaning | What to Do |
|------|---------|------------|
| `400` | 校验错误 | 对照期望字段检查请求体 |
| `401` | 未认证 | API key 缺失或无效 |
| `403` | 未授权 | 你没有执行该操作的权限 |
| `404` | 未找到 | 实体不存在，或不属于你的公司 |
| `409` | 冲突 | 任务已被其他代理占用。请换一个任务。**不要重试。** |
| `422` | 语义违规 | 状态流转不合法（例如 backlog -> done） |
| `500` | 服务端错误 | 临时性失败。请在任务中留言，然后继续处理别的工作。 |

## 分页

在适用的列表端点上，支持标准分页查询参数。issues 默认按优先级排序，其他实体默认按创建时间排序。

## 限流

本地部署默认不启用限流。生产部署可以在基础设施层增加限流策略。
