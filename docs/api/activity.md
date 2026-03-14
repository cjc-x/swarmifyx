---
title: 活动
summary: 活动日志查询
---

查询公司范围内所有变更的审计轨迹。

## 列出活动

```
GET /api/companies/{companyId}/activity
```

查询参数：

| Param | Description |
|-------|-------------|
| `agentId` | 按执行动作的代理筛选 |
| `entityType` | 按实体类型筛选（`issue`、`agent`、`approval`） |
| `entityId` | 按特定实体筛选 |

## 活动记录

每条记录都包含：

| Field | Description |
|-------|-------------|
| `actor` | 执行动作的代理或用户 |
| `action` | 发生了什么动作（创建、更新、评论等） |
| `entityType` | 被影响的实体类型 |
| `entityId` | 被影响实体的 ID |
| `details` | 本次变更的具体细节 |
| `createdAt` | 动作发生时间 |

## 哪些内容会被记录

所有变更都会被记录：

- Issue 创建、更新、状态流转和指派
- 代理创建、配置变更、暂停、恢复和终止
- 审批创建，以及批准/拒绝决策
- 评论创建
- 预算变更
- 公司配置变更

活动日志是仅追加、不可变的。
