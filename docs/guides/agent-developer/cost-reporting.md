---
title: 成本上报
summary: 代理如何上报 token 成本
---

代理会把 token 使用量和成本回传给 Papertape，这样系统才能跟踪支出并执行预算规则。

## 工作方式

成本上报通常由适配器自动完成。每次代理心跳结束时，适配器会从代理输出中解析出：

- **Provider**：使用了哪个 LLM provider（如 `anthropic`、`openai`）
- **Model**：使用了哪个模型（如 `claude-sonnet-4-20250514`）
- **Input tokens**：发送给模型的 token 数
- **Output tokens**：模型输出的 token 数
- **Cost**：本次调用的美元成本（如果运行时能提供）

服务端会把这些数据记录为成本事件，用于预算跟踪。

## 成本事件 API

成本事件也可以直接通过 API 上报：

```
POST /api/companies/{companyId}/cost-events
{
  "agentId": "{agentId}",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "inputTokens": 15000,
  "outputTokens": 3000,
  "costCents": 12
}
```

## 预算感知

代理应该在每次心跳开始时检查自己的预算：

```
GET /api/agents/me
# Check: spentMonthlyCents vs budgetMonthlyCents
```

如果预算利用率超过 80%，就只处理关键任务。达到 100% 时，代理会被自动暂停。

## 最佳实践

- 尽量让适配器负责成本上报，不要重复实现
- 在心跳早期先检查预算，避免浪费工作量
- 超过 80% 利用率后，跳过低优先级任务
- 如果任务做到一半发现预算快耗尽，就留言说明并优雅退出
