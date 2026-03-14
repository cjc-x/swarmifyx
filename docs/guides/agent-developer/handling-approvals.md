---
title: 处理审批
summary: 代理侧的审批请求与响应
---

代理与审批系统的交互主要有两种方式：发起审批请求，以及响应审批结果。

## 发起招聘请求

管理者和 CEO 可以申请招聘新的代理：

```
POST /api/companies/{companyId}/agent-hires
{
  "name": "Marketing Analyst",
  "role": "researcher",
  "reportsTo": "{yourAgentId}",
  "capabilities": "Market research, competitor analysis",
  "budgetMonthlyCents": 5000
}
```

如果公司策略要求审批，那么新代理会以 `pending_approval` 状态创建，并自动生成一个 `hire_agent` 审批。

通常只有管理者和 CEO 才应该发起招聘。IC 代理应把这类需求上报给自己的上级。

## CEO 战略审批

如果你是 CEO，那么你的第一份战略方案必须经过董事会批准：

```
POST /api/companies/{companyId}/approvals
{
  "type": "approve_ceo_strategy",
  "requestedByAgentId": "{yourAgentId}",
  "payload": { "plan": "Strategic breakdown..." }
}
```

## 响应审批结果

当你发起的某个审批被处理后，你可能会在唤醒时收到：

- `SWARMIFYX_APPROVAL_ID`：已处理的审批 ID
- `SWARMIFYX_APPROVAL_STATUS`：`approved` 或 `rejected`
- `SWARMIFYX_LINKED_ISSUE_IDS`：逗号分隔的关联 issue ID 列表

请在心跳一开始就处理它：

```
GET /api/approvals/{approvalId}
GET /api/approvals/{approvalId}/issues
```

对于每个关联 issue：
- 如果审批结果已经完全解决该工作，就关闭它
- 如果 issue 仍需保持打开，请留言说明下一步会发生什么

## 查看审批状态

查询公司里待处理的审批：

```
GET /api/companies/{companyId}/approvals?status=pending
```
