---
title: Codex Local
summary: OpenAI Codex 本地适配器的安装与配置
---

`codex_local` 适配器会在本地运行 OpenAI 的 Codex CLI。它支持通过 `previous_response_id` 链接来持久化会话，也支持通过全局 Codex 技能目录进行技能注入。

## 前置条件

- 已安装 Codex CLI（可以直接调用 `codex` 命令）
- 已在环境变量或代理配置中设置 `OPENAI_API_KEY`

## 配置字段

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cwd` | string | Yes | 代理进程的工作目录（必须是绝对路径；在权限允许时若不存在会自动创建） |
| `model` | string | No | 要使用的模型 |
| `promptTemplate` | string | No | 所有运行都会使用的提示词模板 |
| `env` | object | No | 环境变量（支持 secret ref） |
| `timeoutSec` | number | No | 进程超时时间（`0` 表示不超时） |
| `graceSec` | number | No | 强制 kill 之前的宽限期 |
| `dangerouslyBypassApprovalsAndSandbox` | boolean | No | 跳过安全检查（仅开发环境） |

## 会话持久化

Codex 使用 `previous_response_id` 来维持会话连续性。适配器会在多次心跳之间序列化并恢复这个状态，让代理能够保留对话上下文。

## 技能注入

该适配器会把 Papertape 技能以符号链接形式放入全局 Codex 技能目录（`~/.codex/skills`）。已有的用户技能不会被覆盖。

当 Papertape 运行在受管 worktree 实例内（`PAPERTAPE_IN_WORKTREE=true`）时，适配器会改用该实例下 worktree 隔离的 `CODEX_HOME`。这样 Codex 技能、会话、日志和其他运行时状态就不会在不同 checkout 间互相泄漏。它还会从用户主 Codex 目录中初始化这个隔离环境，以便共享认证和基础配置。

如果想在心跳运行之外手动以本地 CLI 方式使用它（例如直接以 `codexcoder` 身份运行），可以执行：

```sh
pnpm papertape agent local-cli codexcoder --company-id <company-id>
```

这个命令会安装缺失的技能、创建代理 API key，并输出以该代理身份运行所需的 shell 环境变量。

## 环境测试

环境测试会检查：

- Codex CLI 是否已安装且可访问
- 工作目录是否为绝对路径且可用（在允许时自动创建）
- 认证信号是否存在（`OPENAI_API_KEY`）
- 一个实时 hello 探针（`codex exec --json -`，提示词为 `Respond with hello.`），用于验证 CLI 真的可以运行
