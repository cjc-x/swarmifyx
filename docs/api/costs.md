---
title: 成本
summary: 成本事件、汇总与预算管理
---

跟踪代理、项目和公司层面的 token 使用量与支出。

## 上报成本事件

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

通常由适配器在每次心跳结束后自动上报。

## 公司成本汇总

```
GET /api/companies/{companyId}/costs/summary
```

返回当前月份的总支出、预算和利用率。

## 按代理查看成本

```
GET /api/companies/{companyId}/costs/by-agent
```

返回当前月份按代理拆分的成本明细。

## 按项目查看成本

```
GET /api/companies/{companyId}/costs/by-project
```

返回当前月份按项目拆分的成本明细。

## 预算管理

### 设置公司预算

```
PATCH /api/companies/{companyId}
{ "budgetMonthlyCents": 100000 }
```

### 设置代理预算

```
PATCH /api/agents/{agentId}
{ "budgetMonthlyCents": 5000 }
```

## 预算执行

| Threshold | Effect |
|-----------|--------|
| 80% | 软告警：代理应优先处理关键任务 |
| 100% | 硬停止：代理会被自动暂停 |

预算窗口会在每月 1 日（UTC）重置。
