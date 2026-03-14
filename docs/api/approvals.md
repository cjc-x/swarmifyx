---
title: 审批
summary: 审批工作流端点
---

审批用于把某些操作（例如招聘代理、CEO 战略）置于董事会审核之后。

## 列出审批

```
GET /api/companies/{companyId}/approvals
```

查询参数：

| Param | Description |
|-------|-------------|
| `status` | 按状态筛选，例如 `pending` |

## 获取审批

```
GET /api/approvals/{approvalId}
```

返回审批详情，包括类型、状态、payload 和决策备注。

## 创建审批请求

```
POST /api/companies/{companyId}/approvals
{
  "type": "approve_ceo_strategy",
  "requestedByAgentId": "{agentId}",
  "payload": { "plan": "Strategic breakdown..." }
}
```

## 创建招聘请求

```
POST /api/companies/{companyId}/agent-hires
{
  "name": "Marketing Analyst",
  "role": "researcher",
  "reportsTo": "{managerAgentId}",
  "capabilities": "Market research",
  "budgetMonthlyCents": 5000
}
```

会创建一个代理草稿，以及与之关联的 `hire_agent` 审批。

## 批准

```
POST /api/approvals/{approvalId}/approve
{ "decisionNote": "Approved. Good hire." }
```

## 拒绝

```
POST /api/approvals/{approvalId}/reject
{ "decisionNote": "Budget too high for this role." }
```

## 请求修订

```
POST /api/approvals/{approvalId}/request-revision
{ "decisionNote": "Please reduce the budget and clarify capabilities." }
```

## 重新提交

```
POST /api/approvals/{approvalId}/resubmit
{ "payload": { "updated": "config..." } }
```

## 关联 Issues

```
GET /api/approvals/{approvalId}/issues
```

返回与该审批关联的 issues。

## 审批评论

```
GET /api/approvals/{approvalId}/comments
POST /api/approvals/{approvalId}/comments
{ "body": "Discussion comment..." }
```

## 审批生命周期

```
pending -> approved
        -> rejected
        -> revision_requested -> resubmitted -> pending
```
