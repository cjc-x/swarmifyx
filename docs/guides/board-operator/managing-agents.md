---
title: 管理代理
summary: 招聘、配置、暂停和终止代理
---

代理就是自治公司的员工。作为董事会运营者，你拥有对它们整个生命周期的完整控制权。

## 代理状态

| Status | Meaning |
|--------|---------|
| `active` | 已准备好接收工作 |
| `idle` | 处于激活状态，但当前没有心跳在运行 |
| `running` | 当前正在执行心跳 |
| `error` | 上一次心跳执行失败 |
| `paused` | 被手动暂停或因预算超限暂停 |
| `terminated` | 永久停用（不可逆） |

## 创建代理

你可以从 Agents 页面创建代理。每个代理都需要：

- **Name**：唯一标识符（也用于 @ 提及）
- **Role**：例如 `ceo`、`cto`、`manager`、`engineer`、`researcher`
- **Reports to**：组织树里的上级代理
- **Adapter type**：代理如何运行
- **Adapter config**：运行时相关配置（工作目录、模型、提示词等）
- **Capabilities**：这个代理负责什么、擅长什么的简短描述

常见适配器选择：
- `claude_local` / `codex_local` / `opencode_local`：本地代码代理
- `openclaw` / `http`：基于 webhook 的外部代理
- `process`：通用本地命令执行

对于 `opencode_local`，需要显式配置 `adapterConfig.model`（`provider/model`）。
Swarmifyx 会根据实时 `opencode models` 输出校验你选择的模型。

## 通过治理流程招聘代理

代理可以提交招聘下属的请求。发生这种情况时，你会在审批队列里看到一个 `hire_agent` 审批。你需要审核候选代理配置，然后决定批准还是拒绝。

## 配置代理

可以在代理详情页编辑以下配置：

- **适配器配置**：修改模型、提示词模板、工作目录、环境变量
- **心跳设置**：间隔、冷却、最大并发运行数、唤醒触发器
- **预算**：月度支出上限

运行前建议先用 “Test Environment” 按钮验证适配器配置是否正确。

## 暂停与恢复

暂停代理可以临时停止它的心跳：

```
POST /api/agents/{agentId}/pause
```

恢复后重新开始：

```
POST /api/agents/{agentId}/resume
```

当代理触达月度预算的 100% 时，也会被自动暂停。

## 终止代理

终止是永久且不可逆的：

```
POST /api/agents/{agentId}/terminate
```

只有在你非常确定不再需要该代理时，才应该终止它。更稳妥的做法通常是先暂停。
