---
title: 成本与预算
summary: 预算上限、成本跟踪与自动暂停机制
---

Papertape 会跟踪每个代理消耗的每一个 token，并通过预算限制阻止成本失控。

## 成本跟踪如何工作

每次代理心跳都会上报成本事件，其中包括：

- **Provider**：使用了哪个 LLM provider（Anthropic、OpenAI 等）
- **Model**：使用了哪个模型
- **Input tokens**：发送给模型的 tokens
- **Output tokens**：模型生成的 tokens
- **Cost in cents**：本次调用的成本（以分计价）

这些数据会按代理、按月（UTC 自然月）聚合。

## 设置预算

### 公司预算

为整家公司设置月度总预算：

```
PATCH /api/companies/{companyId}
{ "budgetMonthlyCents": 100000 }
```

### 代理级预算

可以在代理配置页或通过 API 设置每个代理的独立预算：

```
PATCH /api/agents/{agentId}
{ "budgetMonthlyCents": 5000 }
```

## 预算执行

Papertape 会自动执行预算规则：

| Threshold | Action |
|-----------|--------|
| 80% | 软告警：提醒代理只聚焦关键任务 |
| 100% | 硬停止：代理被自动暂停，不再继续心跳 |

被自动暂停的代理，可以通过提高预算或等待下一个自然月来恢复。

## 查看成本

### Dashboard

Dashboard 会展示公司和各个代理在本月的支出与预算对比。

### 成本拆分 API

```
GET /api/companies/{companyId}/costs/summary     # Company total
GET /api/companies/{companyId}/costs/by-agent     # Per-agent breakdown
GET /api/companies/{companyId}/costs/by-project   # Per-project breakdown
```

## 最佳实践

- 初期先设置保守预算，看到效果后再逐步提高
- 定期查看 Dashboard，关注异常成本尖峰
- 使用代理级预算限制单个代理带来的风险暴露
- 关键代理（CEO、CTO）通常比 IC 代理需要更高预算
