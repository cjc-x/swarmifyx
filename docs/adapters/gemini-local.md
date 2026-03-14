---
title: Gemini Local
summary: Gemini CLI 本地适配器的安装与配置
---

`gemini_local` 适配器会在本地运行 Google 的 Gemini CLI。它支持通过 `--resume` 持久化会话、技能注入，以及结构化的 `stream-json` 输出解析。

## 前置条件

- 已安装 Gemini CLI（可以直接调用 `gemini` 命令）
- 已设置 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，或者已经完成本地 Gemini CLI 登录

## 配置字段

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cwd` | string | Yes | 代理进程的工作目录（必须是绝对路径；在权限允许时若不存在会自动创建） |
| `model` | string | No | 要使用的 Gemini 模型，默认 `auto` |
| `promptTemplate` | string | No | 所有运行都会使用的提示词模板 |
| `instructionsFilePath` | string | No | 会在提示词前拼接的 Markdown 指令文件 |
| `env` | object | No | 环境变量（支持 secret ref） |
| `timeoutSec` | number | No | 进程超时时间（`0` 表示不超时） |
| `graceSec` | number | No | 强制 kill 之前的宽限期 |
| `yolo` | boolean | No | 为无人值守模式附加 `--approval-mode yolo` |

## 会话持久化

该适配器会在多次心跳之间持久化 Gemini 的 session ID。下次唤醒时，它会通过 `--resume` 恢复原会话，从而保留上下文。

会话恢复会感知 `cwd`。如果工作目录与上次运行相比发生变化，就会改为启动新会话。

如果恢复时出现未知会话错误，适配器会自动重试，并改用新会话。

## 技能注入

该适配器会把 Swarmifyx 技能以符号链接形式放入 Gemini 全局技能目录（`~/.gemini/skills`）。已有用户技能不会被覆盖。

## 环境测试

可以在 UI 中使用 “Test Environment” 按钮校验适配器配置。它会检查：

- Gemini CLI 是否已安装且可访问
- 工作目录是否为绝对路径且可用（在允许时自动创建）
- API key / 认证提示（`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`）
- 一个实时 hello 探针（`gemini --output-format json "Respond with hello."`），用于验证 CLI 已可正常运行
