---
title: 架构
summary: 技术栈概览、请求流与适配器模型
---

Swarmifyx 是一个 monorepo，主要分成四层。

## 技术栈总览

```
┌─────────────────────────────────────┐
│  React UI (Vite)                    │
│  Dashboard, org management, tasks   │
├─────────────────────────────────────┤
│  Express.js REST API (Node.js)      │
│  Routes, services, auth, adapters   │
├─────────────────────────────────────┤
│  PostgreSQL (Drizzle ORM)           │
│  Schema, migrations, embedded mode  │
├─────────────────────────────────────┤
│  Adapters                           │
│  Claude Local, Codex Local,         │
│  Process, HTTP                      │
└─────────────────────────────────────┘
```

## 技术栈

| Layer | Technology |
|-------|-----------|
| 前端 | React 19、Vite 6、React Router 7、Radix UI、Tailwind CSS 4、TanStack Query |
| 后端 | Node.js 20+、Express.js 5、TypeScript |
| 数据库 | PostgreSQL 17（或内嵌 PGlite）、Drizzle ORM |
| 认证 | Better Auth（session + API key） |
| 适配器 | Claude Code CLI、Codex CLI、shell process、HTTP webhook |
| 包管理器 | pnpm 9 + workspaces |

## 仓库结构

```
swarmifyx/
├── ui/                          # React frontend
│   ├── src/pages/              # Route pages
│   ├── src/components/         # React components
│   ├── src/api/                # API client
│   └── src/context/            # React context providers
│
├── server/                      # Express.js API
│   ├── src/routes/             # REST endpoints
│   ├── src/services/           # Business logic
│   ├── src/adapters/           # Agent execution adapters
│   └── src/middleware/         # Auth, logging
│
├── packages/
│   ├── db/                      # Drizzle schema + migrations
│   ├── shared/                  # API types, constants, validators
│   ├── adapter-utils/           # Adapter interfaces and helpers
│   └── adapters/
│       ├── claude-local/        # Claude Code adapter
│       └── codex-local/         # OpenAI Codex adapter
│
├── skills/                      # Agent skills
│   └── swarmifyx/               # Core Swarmifyx skill (heartbeat protocol)
│
├── cli/                         # CLI client
│   └── src/                     # Setup and control-plane commands
│
└── doc/                         # Internal documentation
```

## 请求流

当一次心跳触发时：

1. **触发器**：调度器、手动调用或事件（分配、提及）触发心跳
2. **调用适配器**：服务端调用已配置适配器的 `execute()` 函数
3. **拉起代理进程**：适配器使用 Swarmifyx 环境变量和提示词启动代理，例如 Claude Code CLI
4. **代理执行工作**：代理调用 Swarmifyx 的 REST API 来查看分配、checkout 任务、完成工作并更新状态
5. **采集结果**：适配器捕获 stdout，解析使用量/成本数据，并提取会话状态
6. **记录运行**：服务端保存运行结果、成本和下一次心跳需要的会话状态

## 适配器模型

适配器是 Swarmifyx 与代理运行时之间的桥。每个适配器都由三个模块组成：

- **服务端模块**：负责通过 `execute()` 拉起或调用代理，并提供环境诊断
- **UI 模块**：为运行查看器解析 stdout，并为代理创建页面提供配置表单
- **CLI 模块**：为 `swarmifyx run --watch` 格式化终端输出

内置适配器包括：`claude_local`、`codex_local`、`process`、`http`。你也可以为任意运行时创建自定义适配器。

## 关键设计决策

- **控制平面，而不是执行平面**：Swarmifyx 负责编排代理，而不是亲自执行它们
- **以公司为边界**：所有实体都严格归属于一家公司，数据边界明确
- **单负责人任务模型**：原子 checkout 防止多个代理同时处理同一任务
- **适配器无关**：任何能调用 HTTP API 的运行时都能成为代理
- **默认内嵌**：零配置的本地模式默认带内嵌 PostgreSQL
