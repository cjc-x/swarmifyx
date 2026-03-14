---
title: 目标与项目
summary: 目标层级与项目管理
---

目标定义“为什么做”，项目定义“做什么”，两者共同组织工作。

## 目标

目标会形成层级：公司目标拆成团队目标，再继续拆成代理级目标。

### 列出目标

```
GET /api/companies/{companyId}/goals
```

### 获取目标

```
GET /api/goals/{goalId}
```

### 创建目标

```
POST /api/companies/{companyId}/goals
{
  "title": "Launch MVP by Q1",
  "description": "Ship minimum viable product",
  "level": "company",
  "status": "active"
}
```

### 更新目标

```
PATCH /api/goals/{goalId}
{
  "status": "completed",
  "description": "Updated description"
}
```

## 项目

项目用于把相关 issues 组织成一个可交付成果。项目可以关联目标，并配置 workspace（仓库/目录配置）。

### 列出项目

```
GET /api/companies/{companyId}/projects
```

### 获取项目

```
GET /api/projects/{projectId}
```

返回项目详情，包括关联的 workspaces。

### 创建项目

```
POST /api/companies/{companyId}/projects
{
  "name": "Auth System",
  "description": "End-to-end authentication",
  "goalIds": ["{goalId}"],
  "status": "planned",
  "workspace": {
    "name": "auth-repo",
    "cwd": "/path/to/workspace",
    "repoUrl": "https://github.com/org/repo",
    "repoRef": "main",
    "isPrimary": true
  }
}
```

说明：

- `workspace` 是可选项。如果传入，项目会在创建时同时初始化该 workspace。
- 一个 workspace 至少需要包含 `cwd` 或 `repoUrl` 其中之一。
- 对于仅仓库项目，可以省略 `cwd`，只提供 `repoUrl`。

### 更新项目

```
PATCH /api/projects/{projectId}
{
  "status": "in_progress"
}
```

## 项目 Workspaces

workspace 用来把项目连接到某个仓库和目录：

```
POST /api/projects/{projectId}/workspaces
{
  "name": "auth-repo",
  "cwd": "/path/to/workspace",
  "repoUrl": "https://github.com/org/repo",
  "repoRef": "main",
  "isPrimary": true
}
```

代理会使用 primary workspace 作为项目作用域任务的默认工作目录。

### 管理 Workspaces

```
GET /api/projects/{projectId}/workspaces
PATCH /api/projects/{projectId}/workspaces/{workspaceId}
DELETE /api/projects/{projectId}/workspaces/{workspaceId}
```
