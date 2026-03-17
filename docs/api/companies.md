---
title: 公司
summary: 公司 CRUD 端点
---

在你的 Chopsticks 实例中管理公司。

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
  "budgetMonthlyCents": 100000,
  "logoAssetId": "b9f5e911-6de5-4cd0-8dc6-a55a13bc02f6"
}
```

## 上传公司 Logo

上传公司图标图片，并将其存储为该公司的 logo。

```
POST /api/companies/{companyId}/logo
Content-Type: multipart/form-data
```

支持的图片内容类型：

- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`
- `image/gif`
- `image/svg+xml`

公司 logo 上传沿用 Chopsticks 常规附件大小限制。

随后可将返回的 `assetId` PATCH 到 `logoAssetId` 字段来设置公司 logo。

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
| `logoAssetId` | string | 可选的已存储 logo 资源 ID |
| `logoUrl` | string | 可选的 Chopsticks 资源内容路径 |
| `budgetMonthlyCents` | number | 月度预算上限 |
| `createdAt` | string | ISO 时间戳 |
| `updatedAt` | string | ISO 时间戳 |
