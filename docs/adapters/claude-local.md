---
title: Claude Local
summary: Claude Code 本地适配器的安装与配置
---

`claude_local` 适配器会在本地运行 Anthropic 的 Claude Code CLI。它支持会话持久化、技能注入以及结构化输出解析。

## 前置条件

- 已安装 Claude Code CLI（可以直接调用 `claude` 命令）
- 已在环境变量或代理配置中设置 `ANTHROPIC_API_KEY`

## 配置字段

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cwd` | string | Yes | 代理进程的工作目录（必须是绝对路径；在权限允许时若不存在会自动创建） |
| `model` | string | No | 要使用的 Claude 模型，例如 `claude-opus-4-6` |
| `promptTemplate` | string | No | 所有运行都会使用的提示词模板 |
| `env` | object | No | 环境变量（支持 secret ref） |
| `timeoutSec` | number | No | 进程超时时间（`0` 表示不超时） |
| `graceSec` | number | No | 强制 kill 之前的宽限期 |
| `maxTurnsPerRun` | number | No | 每次心跳允许的最大 agentic turn 数（默认 `300`） |
| `dangerouslySkipPermissions` | boolean | No | 跳过权限提示（仅开发环境） |

## 提示词模板

模板支持 `{{variable}}` 形式的变量替换：

| Variable | Value |
|----------|-------|
| `{{agentId}}` | Agent's ID |
| `{{companyId}}` | Company ID |
| `{{runId}}` | Current run ID |
| `{{agent.name}}` | Agent's name |
| `{{company.name}}` | Company name |

## 会话持久化

该适配器会在心跳之间持久化 Claude Code 的 session ID。下次唤醒时，它会恢复原有会话，从而保留完整上下文。

会话恢复会感知 `cwd`。如果代理的工作目录与上次运行相比发生变化，则会改为启动一个全新会话。

如果恢复失败并出现未知会话错误，适配器会自动重试，并使用一个新会话重新开始。

## 技能注入

该适配器会创建一个临时目录，把 Swarmifyx 技能以符号链接形式放进去，并通过 `--add-dir` 传给 Claude。这样既能让技能可发现，又不会污染代理自己的工作目录。

如果想在心跳运行之外手动以本地 CLI 方式使用它（例如直接以 `claudecoder` 身份运行），可以执行：

```sh
pnpm swarmifyx agent local-cli claudecoder --company-id <company-id>
```

这个命令会把 Swarmifyx 技能安装到 `~/.claude/skills`，创建一个代理 API key，并输出以该代理身份运行所需的 shell 环境变量。

## 环境测试

可以在 UI 中使用 “Test Environment” 按钮校验适配器配置。它会检查：

- Claude CLI 是否已安装且可访问
- 工作目录是否为绝对路径且可用（在允许时自动创建）
- API key / 认证模式提示（`ANTHROPIC_API_KEY` 还是订阅登录）
- 一个实时 hello 探针（`claude --print - --output-format stream-json --verbose`，提示词为 `Respond with hello.`），用于验证 CLI 已可正常运行
