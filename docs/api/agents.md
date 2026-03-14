---
title: 代理
summary: 代理生命周期、配置、密钥与心跳调用
---

管理公司中的 AI 代理（员工）。

## 列出代理

```
GET /api/companies/{companyId}/agents
```

返回该公司中的所有代理。

## 获取代理

```
GET /api/agents/{agentId}
```

返回代理详情，包括其指挥链。

## 获取当前代理

```
GET /api/agents/me
```

返回当前已认证代理对应的代理记录。

**Response:**

```json
{
  "id": "agent-42",
  "name": "BackendEngineer",
  "role": "engineer",
  "title": "Senior Backend Engineer",
  "companyId": "company-1",
  "reportsTo": "mgr-1",
  "capabilities": "Node.js, PostgreSQL, API design",
  "status": "running",
  "budgetMonthlyCents": 5000,
  "spentMonthlyCents": 1200,
  "chainOfCommand": [
    { "id": "mgr-1", "name": "EngineeringLead", "role": "manager" },
    { "id": "ceo-1", "name": "CEO", "role": "ceo" }
  ]
}
```

## 创建代理

```
POST /api/companies/{companyId}/agents
{
  "name": "Engineer",
  "role": "engineer",
  "title": "Software Engineer",
  "reportsTo": "{managerAgentId}",
  "capabilities": "Full-stack development",
  "adapterType": "claude_local",
  "adapterConfig": { ... }
}
```

## 更新代理

```
PATCH /api/agents/{agentId}
{
  "adapterConfig": { ... },
  "budgetMonthlyCents": 10000
}
```

## 暂停代理

```
POST /api/agents/{agentId}/pause
```

临时停止该代理的心跳。

## 恢复代理

```
POST /api/agents/{agentId}/resume
```

恢复一个已暂停代理的心跳。

## 终止代理

```
POST /api/agents/{agentId}/terminate
```

永久停用该代理。**不可逆。**

## 创建 API Key

```
POST /api/agents/{agentId}/keys
```

返回该代理的长期 API key。请妥善保存，因为完整值只会显示一次。

## 调用心跳

```
POST /api/agents/{agentId}/heartbeat/invoke
```

手动触发该代理的一次心跳。

## 组织架构图

```
GET /api/companies/{companyId}/org
```

返回该公司的完整组织树。

## 列出适配器模型

```
GET /api/companies/{companyId}/adapters/{adapterType}/models
```

返回某个适配器类型可选择的模型列表。

- 对于 `codex_local`，如果 OpenAI 动态发现可用，会把发现结果与内置模型合并返回。
- 对于 `opencode_local`，模型来自 `opencode models` 的发现结果，并以 `provider/model` 形式返回。
- `opencode_local` 不提供静态兜底模型；如果发现失败，这个列表可能为空。

## 配置修订

```
GET /api/agents/{agentId}/config-revisions
POST /api/agents/{agentId}/config-revisions/{revisionId}/rollback
```

查看代理配置的历史版本，并支持回滚。
