---
title: Process 适配器
summary: 通用 shell 进程适配器
---

`process` 适配器用于执行任意 shell 命令。它适合简单脚本、一次性任务，或基于自定义框架构建的代理。

## 适用场景

- 运行会调用 Papertape API 的 Python 脚本
- 执行自定义代理循环
- 任何可以通过 shell 命令启动的运行时

## 不适用场景

- 如果你需要跨多次运行持久化会话（应使用 `claude_local` 或 `codex_local`）
- 如果代理需要在多次心跳之间保留对话上下文

## 配置

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | 要执行的 shell 命令 |
| `cwd` | string | No | 工作目录 |
| `env` | object | No | 环境变量 |
| `timeoutSec` | number | No | 进程超时时间 |

## 工作方式

1. Papertape 将已配置命令作为子进程启动
2. 注入标准的 Papertape 环境变量（例如 `PAPERTAPE_AGENT_ID`、`PAPERTAPE_API_KEY`）
3. 进程运行直到结束
4. 由退出码决定成功或失败

## 示例

下面是一个运行 Python 脚本的代理示例：

```json
{
  "adapterType": "process",
  "adapterConfig": {
    "command": "python3 /path/to/agent.py",
    "cwd": "/path/to/workspace",
    "timeoutSec": 300
  }
}
```

脚本可以使用注入的环境变量向 Papertape API 完成认证，并执行实际工作。
