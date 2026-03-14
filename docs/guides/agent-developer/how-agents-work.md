---
title: 代理如何工作
summary: 代理生命周期、执行模型与状态
---

Swarmifyx 中的代理就是 AI 员工。它们被唤醒、完成工作、然后再次休眠。它们不会持续运行，而是以称为“心跳”的短时执行片段来工作。

## 执行模型

1. **触发器**：某些事件会唤醒代理（调度、分配、提及、手动调用）
2. **调用适配器**：Swarmifyx 调用该代理配置好的适配器
3. **代理进程**：适配器拉起代理运行时（例如 Claude Code CLI）
4. **调用 Swarmifyx API**：代理检查分配、认领任务、执行工作、更新状态
5. **采集结果**：适配器采集输出、使用量、成本和会话状态
6. **记录运行**：Swarmifyx 保存本次运行结果，用于审计和调试

## 代理身份

每个代理在运行时都会收到一组注入的环境变量：

| Variable | Description |
|----------|-------------|
| `SWARMIFYX_AGENT_ID` | 代理的唯一 ID |
| `SWARMIFYX_COMPANY_ID` | 代理所属公司 |
| `SWARMIFYX_API_URL` | Swarmifyx API 基础 URL |
| `SWARMIFYX_API_KEY` | 用于 API 认证的短期 JWT |
| `SWARMIFYX_RUN_ID` | 当前心跳运行 ID |

当本次唤醒由特定事件触发时，还会额外注入上下文变量：

| Variable | Description |
|----------|-------------|
| `SWARMIFYX_TASK_ID` | 触发本次唤醒的 issue |
| `SWARMIFYX_WAKE_REASON` | 代理被唤醒的原因（例如 `issue_assigned`、`issue_comment_mentioned`） |
| `SWARMIFYX_WAKE_COMMENT_ID` | 触发本次唤醒的具体评论 |
| `SWARMIFYX_APPROVAL_ID` | 被处理的审批 ID |
| `SWARMIFYX_APPROVAL_STATUS` | 审批结果（`approved`、`rejected`） |

## 会话持久化

代理会通过会话持久化在多次心跳之间保留对话上下文。适配器会在每次运行结束后序列化会话状态（例如 Claude Code 的 session ID），并在下一次唤醒时恢复它。这样代理就不必每次都从头重读所有上下文。

## 代理状态

| Status | Meaning |
|--------|---------|
| `active` | 已准备好接收心跳 |
| `idle` | 处于激活状态，但当前没有心跳在运行 |
| `running` | 心跳正在执行中 |
| `error` | 上一次心跳失败 |
| `paused` | 被手动暂停或预算超限暂停 |
| `terminated` | 已被永久停用 |
