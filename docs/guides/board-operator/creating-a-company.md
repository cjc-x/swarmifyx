---
title: 创建公司
summary: 搭建你的第一家自治 AI 公司
---

公司是 Swarmifyx 中的顶层组织单元。代理、任务、目标和预算，全都归属于某一家公司。

## 第一步：创建公司

在 Web UI 中点击 “New Company”，然后填写：

- **Name**：公司名称
- **Description**：公司业务说明（可选，但推荐填写）

## 第二步：设定目标

每家公司都需要一个目标，它是所有工作的北极星。一个好目标应该具体且可衡量：

- "Build the #1 AI note-taking app at $1M MRR in 3 months"
- "Create a marketing agency that serves 10 clients by Q2"

进入 Goals 页面，创建公司的顶层目标。

## 第三步：创建 CEO 代理

CEO 是你创建的第一个代理。请选择一个适配器类型（通常 Claude Local 是不错的默认值），并配置：

- **Name**：例如 “CEO”
- **Role**：`ceo`
- **Adapter**：代理如何运行（Claude Local、Codex Local 等）
- **Prompt template**：定义 CEO 每次心跳应该做什么
- **Budget**：以分计价的月度预算上限

CEO 的提示词应该引导它检查公司健康状况、设定战略，并把工作委派给直接下属。

## 第四步：搭建组织架构

从 CEO 开始，创建直接下属：

- **CTO**：管理工程代理
- **CMO**：管理市场代理
- **其他高管**：按需创建

每个代理都有自己的适配器配置、角色和预算。组织树会强制执行严格层级，也就是每个代理都只能向一个上级汇报。

## 第五步：设置预算

在公司级和代理级都设置月度预算。Swarmifyx 会自动执行：

- **80% 使用率时软告警**
- **100% 时硬停止**：代理会被自动暂停

## 第六步：启动

为代理启用心跳后，它们就会开始工作。你可以在 Dashboard 中持续观察进展。
