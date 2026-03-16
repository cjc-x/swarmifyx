---
title: 代理配置与活动 UI
summary: 代理创建、配置、运行历史和组织视图的产品规格
---

# 代理配置与活动 UI

## 背景

代理是 Papertape 公司中的“员工”。每个代理都有：

- 一个适配器类型（如 `claude_local`、`codex_local`、`process`、`http`），决定它如何运行
- 在组织架构中的位置（向谁汇报）
- 一套心跳策略（何时、如何被唤醒）
- 预算与运行限制

`/agents` 相关 UI 需要支持：

1. 创建并配置代理
2. 查看代理在组织中的位置
3. 检查代理最近做了什么，包括运行历史、实时日志和累计成本

本规格覆盖三个主要界面：

1. **创建代理对话框**
2. **代理详情页**
3. **代理列表页**

---

## 1. 创建代理对话框

遵循现有 `NewIssueDialog` / `NewProjectDialog` 模式：

- 使用 `Dialog` 组件
- 支持展开 / 最小化切换
- 顶部展示 company badge breadcrumb
- 支持 `Cmd+Enter` 提交

## 字段

### 身份信息（始终可见）

| 字段 | 控件 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| Name | 大号文本输入 | 是 | 无 | 如 “Alice”“Build Bot” |
| Title | 副标题文本输入 | 否 | 无 | 如 “VP of Engineering” |
| Role | 芯片式 popover 选择器 | 否 | `general` | 值来自 `AGENT_ROLES` |
| Reports To | 芯片式代理选择器 | 否 | 无 | 首个代理时自动设为 CEO 并禁用该字段 |
| Capabilities | 文本输入 | 否 | 无 | 描述代理能做什么 |

### 适配器配置（可折叠，默认展开）

| 字段 | 控件 | 默认值 | 说明 |
|---|---|---|---|
| Adapter Type | 芯片式选择器 | `claude_local` | 支持 `claude_local`、`codex_local`、`process`、`http` |
| Test Environment | 按钮 | 无 | 运行当前未保存配置的适配器诊断 |
| CWD | 文本输入 | 无 | 本地适配器的工作目录 |
| Prompt Template | 多行输入框 | 无 | 支持 `{{ agent.id }}`、`{{ agent.name }}` 等变量 |
| Model | 文本输入 | 无 | 可选模型覆盖 |

### 适配器专属字段

#### `claude_local`

| 字段 | 控件 | 默认值 |
|---|---|---|
| Max Turns Per Run | 数字输入 | 80 |
| Skip Permissions | 开关 | true |

#### `codex_local`

| 字段 | 控件 | 默认值 |
|---|---|---|
| Search | 开关 | false |
| Bypass Sandbox | 开关 | true |

#### `process`

| 字段 | 控件 | 默认值 |
|---|---|---|
| Command | 文本输入 | 无 |
| Args | 文本输入（逗号分隔） | 无 |

#### `http`

| 字段 | 控件 | 默认值 |
|---|---|---|
| URL | 文本输入 | 无 |
| Method | 下拉选择 | `POST` |
| Headers | 键值对编辑器 | 无 |

### 运行时配置（可折叠，默认收起）

| 字段 | 控件 | 默认值 |
|---|---|---|
| Context Mode | 芯片式选择器 | `thin` |
| Monthly Budget (cents) | 数字输入 | 0 |
| Timeout (sec) | 数字输入 | 900 |
| Grace Period (sec) | 数字输入 | 15 |
| Extra Args | 文本输入 | 无 |
| Env Vars | 键值对编辑器 | 无 |

### 心跳策略（可折叠，默认收起）

| 字段 | 控件 | 默认值 |
|---|---|---|
| Enabled | 开关 | true |
| Interval (sec) | 数字输入 | 300 |
| Wake on Assignment | 开关 | true |
| Wake on On-Demand | 开关 | true |
| Wake on Automation | 开关 | true |
| Cooldown (sec) | 数字输入 | 10 |

## 行为

- 提交时调用 `agentsApi.create(companyId, data)`
- `data` 顶层存身份字段，适配器相关字段打包进 `adapterConfig`，心跳 / 运行时字段打包进 `runtimeConfig`
- 创建成功后跳转到新的代理详情页
- 如果公司里还没有代理，则自动把 `role` 设为 `ceo` 并禁用 `Reports To`
- 当适配器类型变化时，应动态切换专属字段，但尽量保留共享字段值

---

## 2. 代理详情页

现有详情页保留顶部 header，但整体改造成更丰富的标签页结构。

## Header

```txt
[StatusBadge]  Agent Name                    [Invoke] [Pause/Resume] [...]
               Role / Title
```

`[...]` 溢出菜单包含：

- Terminate
- Reset Session
- Create API Key

## Tabs

### Overview

两列布局：左侧是摘要卡片，右侧是组织位置卡片。

**摘要卡片：**

- 适配器类型 + 模型（如果有）
- 心跳间隔（如 “every 5 min”）或 “Disabled”
- 最近一次心跳时间（相对时间）
- 会话状态：`Active (session abc123...)` 或 `No session`
- 本月支出 / 预算进度条

**组织位置卡片：**

- Reports to：可点击代理名，跳转到上级详情页
- Direct reports：直属下属列表

### Configuration

使用与创建对话框一致的字段分区，但预填当前值。  
交互方式采用 **inline editing**：

- 点击值后进入编辑状态
- 按 Enter 或失焦即保存
- 每个字段单独触发 `agentsApi.update()`
- 校验错误直接显示在字段附近

建议分区：

- Identity
- Adapter Config
- Heartbeat Policy
- Runtime

### Runs

这是代理活动与历史的主视图，按时间倒序分页展示 heartbeat runs。

**列表项应显示：**

- 状态图标
- 短 run ID（前 8 位）
- 触发来源（timer、assignment、on_demand、automation）
- 相对时间
- token 使用摘要
- 成本
- 结果摘要（第一行结果或错误）

点击某条运行后，可以展开 accordion 或打开 slide-over，查看：

- 状态时间线（queued -> running -> outcome）
- 会话前后变化
- token 细分（input / output / cached）
- 成本细分
- 错误信息 / 错误码
- 退出码和信号（如果有）

**日志查看器：**

- 从 `heartbeat_run_events` 按 `seq` 顺序拉取
- `stdout` / `stderr` 使用等宽字体展示
- 系统事件使用不同样式
- 对运行中的任务通过实时事件（`heartbeat.run.event`、`heartbeat.run.log`）追加更新
- 默认只显示最后 200 条，可“Load more”

### Issues

保留当前行为：列出分配给该代理的 issues，并支持点击跳转。

### Costs

扩展现有成本页，增加：

- 来自 `agent_runtime_state` 的累计总量：input / output / cached tokens、总成本
- 月度预算进度条
- 按 run 维度展示的成本表格
- 可选：最近 30 天的日成本柱状图

## Properties Panel（右侧属性栏）

继续保留现有 `AgentProperties` 面板，并补充：

- Session ID（截断显示，带复制按钮）
- Last error（如果有，则红色高亮）
- “View Configuration” 链接（滚动或切换到配置标签页）

---

## 3. 代理列表页

## 当前状态

当前是扁平列表，展示状态徽章、名称、角色、title 和预算条。

## 改进项

### Header

- 增加 **New Agent** 按钮（Plus 图标 + 文案）
- 点击后打开创建代理对话框

### 视图切换

支持两种视图：

- List View（当前模式）
- Org Chart View（组织树）

### Org Chart View

- 用树状结构展示汇报关系
- 每个节点显示：代理名称、角色、状态徽章
- CEO 位于顶部
- 数据来源使用现有 `agentsApi.org(companyId)`，返回 `OrgNode[]`
- 点击节点跳转到代理详情页

### List View 增强

- 每行增加 adapter type chip
- 增加 “last active” 相对时间
- 若代理当前有运行中的 heartbeat，则显示动画中的 running indicator

### 过滤

支持与 Issues 页类似的 tab filter：

- All
- Active
- Paused
- Error

---

## 4. 组件清单

新增组件建议：

| 组件 | 作用 |
|---|---|
| `NewAgentDialog` | 创建代理表单对话框 |
| `AgentConfigForm` | 创建 + 编辑共用的表单区块 |
| `AdapterConfigFields` | 按适配器类型切换显示字段 |
| `HeartbeatPolicyFields` | 心跳策略字段 |
| `EnvVarEditor` | 环境变量键值对编辑器 |
| `RunListItem` | 运行历史列表项 |
| `RunDetail` | 展开的运行详情与日志查看器 |
| `LogViewer` | 自动滚动的流式日志查看器 |
| `OrgChart` | 组织树可视化 |
| `AgentSelect` | 可复用的代理选择器 |

复用现有组件：

- `StatusBadge`
- `EntityRow`
- `EmptyState`
- `PropertyRow`
- shadcn：`Dialog`、`Tabs`、`Button`、`Popover`、`Command`、`Separator`、`Toggle`

---

## 5. API Surface

V1 不需要新增后端接口，现有 API 已经足够。

| 动作 | 端点 | 使用位置 |
|---|---|---|
| List agents | `GET /companies/:id/agents` | 列表页 |
| Get org tree | `GET /companies/:id/org` | 组织树视图 |
| Create agent | `POST /companies/:id/agents` | 创建对话框 |
| Update agent | `PATCH /agents/:id` | 配置页 |
| Pause / Resume / Terminate | `POST /agents/:id/{action}` | Header 动作 |
| Reset session | `POST /agents/:id/runtime-state/reset-session` | 溢出菜单 |
| Create API key | `POST /agents/:id/keys` | 溢出菜单 |
| Get runtime state | `GET /agents/:id/runtime-state` | Overview、属性栏 |
| Invoke / Wakeup | `POST /agents/:id/heartbeat/invoke` | Header 按钮 |
| List runs | `GET /companies/:id/heartbeat-runs?agentId=X` | Runs 页 |
| Cancel run | `POST /heartbeat-runs/:id/cancel` | Run 详情 |
| Run events | `GET /heartbeat-runs/:id/events` | 日志查看器 |
| Run log | `GET /heartbeat-runs/:id/log` | 完整日志视图 |

---

## 6. 实施顺序

1. **New Agent Dialog**：先打通 UI 内创建代理能力
2. **Agents List 增强**：补上 New Agent 按钮、筛选、adapter chip、running indicator
3. **Agent Detail / Configuration**：支持编辑 adapter / heartbeat / runtime
4. **Agent Detail / Runs**：展示运行历史、状态、token、成本
5. **Run Detail + Log Viewer**：增加展开详情和流式日志
6. **Overview Tab**：补摘要卡片和组织位置卡片
7. **Costs Tab**：扩展成本细节
8. **Org Chart View**：实现组织树视图
9. **Properties Panel**：补 session ID 和 last error

其中 1-5 是核心闭环，6-9 属于增强与打磨。
