---
title: 适配器概览
summary: 什么是适配器，以及它如何把代理连接到 Swarmifyx
---

适配器是 Swarmifyx 编排层与代理运行时之间的桥梁。每个适配器都知道如何调用某一类 AI 代理，并把它的执行结果采集回来。

## 适配器如何工作

当心跳触发时，Swarmifyx 会：

1. 读取代理的 `adapterType` 和 `adapterConfig`
2. 带着执行上下文调用适配器的 `execute()` 函数
3. 由适配器拉起或调用实际代理运行时
4. 由适配器采集 stdout、解析使用量/成本数据，并返回结构化结果

## 内置适配器

| Adapter | Type Key | Description |
|---------|----------|-------------|
| [Claude Local](/adapters/claude-local) | `claude_local` | 在本地运行 Claude Code CLI |
| [Codex Local](/adapters/codex-local) | `codex_local` | 在本地运行 OpenAI Codex CLI |
| [Gemini Local](/adapters/gemini-local) | `gemini_local` | 在本地运行 Gemini CLI |
| OpenCode Local | `opencode_local` | 在本地运行 OpenCode CLI（多提供商 `provider/model`） |
| OpenClaw | `openclaw` | 向 OpenClaw webhook 发送唤醒负载 |
| [Process](/adapters/process) | `process` | 执行任意 shell 命令 |
| [HTTP](/adapters/http) | `http` | 向外部代理发送 webhook |

## 适配器架构

每个适配器都是一个独立 package，包含三个模块：

```
packages/adapters/<name>/
  src/
    index.ts            # Shared metadata (type, label, models)
    server/
      execute.ts        # Core execution logic
      parse.ts          # Output parsing
      test.ts           # Environment diagnostics
    ui/
      parse-stdout.ts   # Stdout -> transcript entries for run viewer
      build-config.ts   # Form values -> adapterConfig JSON
    cli/
      format-event.ts   # Terminal output for `swarmifyx run --watch`
```

这三个模块分别被三个注册表使用：

| Registry | What it does |
|----------|-------------|
| **Server** | 执行代理并采集结果 |
| **UI** | 渲染运行转录内容并提供配置表单 |
| **CLI** | 为实时观察格式化终端输出 |

## 如何选择适配器

- **需要代码代理？** 使用 `claude_local`、`codex_local`、`gemini_local` 或 `opencode_local`
- **需要执行脚本或命令？** 使用 `process`
- **需要调用外部服务？** 使用 `http`
- **需要自定义运行时？** [自己创建一个适配器](/adapters/creating-an-adapter)
