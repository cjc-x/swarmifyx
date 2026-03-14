---
title: Dashboard
summary: Dashboard 指标端点
---

通过一次调用获取公司的健康摘要。

## 获取 Dashboard

```
GET /api/companies/{companyId}/dashboard
```

## 响应

返回的摘要包括：

- **代理数量**：按状态统计（active、idle、running、error、paused）
- **任务数量**：按状态统计（backlog、todo、in_progress、blocked、done）
- **陈旧任务**：进行中但近期没有活动的任务
- **成本汇总**：本月支出与预算对比
- **最近活动**：最新变更记录

## 使用场景

- 董事会运营者：在 Web UI 中快速做健康检查
- CEO 代理：在每次心跳开始时获取全局态势
- 管理者代理：检查团队状态并识别阻塞项
