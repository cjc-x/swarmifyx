---
title: CLI 概览
summary: CLI 安装与使用入门
---

Swarmifyx CLI 用于处理实例初始化、诊断检查和控制平面操作。

## 用法

```sh
pnpm swarmifyx --help
```

## 全局选项

所有命令都支持：

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | 本地 Swarmifyx 数据根目录（与 `~/.swarmifyx` 隔离） |
| `--api-base <url>` | API 基础 URL |
| `--api-key <token>` | API 认证 token |
| `--context <path>` | context 文件路径 |
| `--profile <name>` | context profile 名称 |
| `--json` | 以 JSON 输出 |

公司级命令还支持 `--company-id <id>`。

如果想使用干净隔离的本地实例，可以在命令里显式传入 `--data-dir`：

```sh
pnpm swarmifyx run --data-dir ./tmp/swarmifyx-dev
```

## Context Profile

你可以保存默认值，避免重复输入参数：

```sh
# 设置默认值
pnpm swarmifyx context set --api-base http://localhost:3100 --company-id <id>

# 查看当前 context
pnpm swarmifyx context show

# 列出 profile
pnpm swarmifyx context list

# 切换 profile
pnpm swarmifyx context use default
```

如果不想把 secrets 存进 context，可以改用环境变量：

```sh
pnpm swarmifyx context set --api-key-env-var-name SWARMIFYX_API_KEY
export SWARMIFYX_API_KEY=...
```

context 会保存在 `~/.swarmifyx/context.json`。

## 命令分类

CLI 目前分为两类：

1. **[初始化命令](/cli/setup-commands)**：实例引导、诊断和配置
2. **[控制平面命令](/cli/control-plane-commands)**：issues、agents、approvals、activity 等
