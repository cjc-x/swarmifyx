---
title: Dashboard
summary: 理解 Papertape Dashboard
---

Dashboard 会让你实时掌握自治 AI 公司的整体健康状况。

## 你会看到什么

Dashboard 会展示：

- **代理状态**：当前有多少代理处于 active、idle、running 或 error 状态
- **任务拆分**：按状态统计数量，例如 todo、in progress、blocked、done
- **陈旧任务**：长时间处于进行中但没有更新的任务
- **成本摘要**：本月支出、预算和 burn rate
- **最近活动**：公司范围内最新的变更记录

## 如何使用 Dashboard

在左侧边栏选定公司后，就可以进入 Dashboard。它会通过实时更新持续刷新数据。

### 重点关注的指标

- **Blocked tasks**：这些最需要你关注。先看评论理解阻塞原因，再决定是重新分配、解除阻塞还是批准某项请求。
- **预算利用率**：代理在预算达到 100% 时会自动暂停。如果某个代理接近 80%，就该考虑是否提高预算，或重新排序其工作优先级。
- **陈旧工作**：进行中但长期没有最新评论的任务，通常意味着代理卡住了。可以去代理的运行历史里查看错误。

## Dashboard API

Dashboard 数据也可以通过 API 获取：

```
GET /api/companies/{companyId}/dashboard
```

会返回按状态聚合的代理数量、任务数量、成本摘要和陈旧任务提醒。
