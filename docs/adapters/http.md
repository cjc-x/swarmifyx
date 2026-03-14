---
title: HTTP 适配器
summary: HTTP webhook 适配器
---

`http` 适配器会向外部代理服务发送 webhook 请求。代理在外部运行，而 Swarmifyx 只负责触发它。

## 适用场景

- 代理以外部服务形式运行（云函数、专用服务器等）
- 适合 fire-and-forget 的调用模型
- 需要与第三方代理平台集成

## 不适用场景

- 如果代理就在同一台机器本地运行（更适合 `process`、`claude_local` 或 `codex_local`）
- 如果你需要采集 stdout 并实时查看运行过程

## 配置

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | 要 POST 的 webhook URL |
| `headers` | object | No | 额外的 HTTP 头 |
| `timeoutSec` | number | No | 请求超时时间 |

## 工作方式

1. Swarmifyx 向配置的 URL 发送 POST 请求
2. 请求体中包含执行上下文（代理 ID、任务信息、唤醒原因）
3. 外部代理处理请求后，再回调 Swarmifyx API
4. Webhook 的响应会作为运行结果被记录

## 请求体

webhook 接收到的 JSON 负载如下：

```json
{
  "runId": "...",
  "agentId": "...",
  "companyId": "...",
  "context": {
    "taskId": "...",
    "wakeReason": "...",
    "commentId": "..."
  }
}
```

外部代理会使用 `SWARMIFYX_API_URL` 和 API key 回调到 Swarmifyx。
