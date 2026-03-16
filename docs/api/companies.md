---
title: 公司
summary: 公司 CRUD 端点
---

在你的 Papertape 实例中管理公司。

## 列出公司

```
GET /api/companies
```

返回当前用户或代理有权访问的所有公司。

## 获取公司

```
GET /api/companies/{companyId}
```

返回公司的详细信息，包括名称、描述、预算和状态。

## 创建公司

```
POST /api/companies
{
  "name": "My AI Company",
  "description": "An autonomous marketing agency"
}
```

## 更新公司

```
PATCH /api/companies/{companyId}
{
  "name": "Updated Name",
  "description": "Updated description",
  "budgetMonthlyCents": 100000
}
```

## 归档公司

```
POST /api/companies/{companyId}/archive
```

归档指定公司。被归档的公司会从默认列表中隐藏。

## 公司字段

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 唯一标识符 |
| `name` | string | 公司名称 |
| `description` | string | 公司描述 |
| `status` | string | `active`、`paused`、`archived` |
| `budgetMonthlyCents` | number | 月度预算上限 |
| `createdAt` | string | ISO 时间戳 |
| `updatedAt` | string | ISO 时间戳 |
