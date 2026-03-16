---
title: 创建适配器
summary: 构建自定义适配器的指南
---

构建自定义适配器，把 Papertape 接入任意代理运行时。

<Tip>
如果你在使用 Claude Code，可以借助 `.agents/skills/create-agent-adapter` 这个 skill 以交互方式完成整个适配器创建流程。只要让 Claude 帮你创建一个新适配器，它就会一步步带你走完。
</Tip>

## Package 结构

```
packages/adapters/<name>/
  package.json
  tsconfig.json
  src/
    index.ts            # Shared metadata
    server/
      index.ts          # Server exports
      execute.ts        # Core execution logic
      parse.ts          # Output parsing
      test.ts           # Environment diagnostics
    ui/
      index.ts          # UI exports
      parse-stdout.ts   # Transcript parser
      build-config.ts   # Config builder
    cli/
      index.ts          # CLI exports
      format-event.ts   # Terminal formatter
```

## 第一步：根元数据

`src/index.ts` 会被三个消费者同时导入，所以要尽量保持无额外依赖。

```ts
export const type = "my_agent";        // snake_case, globally unique
export const label = "My Agent (local)";
export const models = [
  { id: "model-a", label: "Model A" },
];
export const agentConfigurationDoc = `# my_agent configuration
Use when: ...
Don't use when: ...
Core fields: ...
`;
```

## 第二步：服务端 execute

`src/server/execute.ts` 是核心模块。它接收 `AdapterExecutionContext`，并返回 `AdapterExecutionResult`。

核心职责包括：

1. 使用安全辅助函数读取配置，例如 `asString`、`asNumber`
2. 用 `buildPapertapeEnv(agent)` 和上下文变量构建环境
3. 从 `runtime.sessionParams` 中恢复会话状态
4. 用 `renderTemplate(template, data)` 渲染提示词
5. 使用 `runChildProcess()` 拉起进程，或通过 `fetch()` 调用外部服务
6. 解析输出中的用量、成本、会话状态和错误信息
7. 处理未知会话错误（使用全新会话重试，并设置 `clearSession: true`）

## 第三步：环境测试

`src/server/test.ts` 用于在真正运行前校验适配器配置。

请返回结构化诊断结果：

- `error`：配置无效或不可用
- `warn`：非阻塞问题
- `info`：成功检查信息

## 第四步：UI 模块

- `parse-stdout.ts`：把 stdout 行转换成运行查看器使用的 `TranscriptEntry[]`
- `build-config.ts`：把表单值转换成 `adapterConfig` JSON
- 配置字段 React 组件位于 `ui/src/adapters/<name>/config-fields.tsx`

## 第五步：CLI 模块

`format-event.ts` 使用 `picocolors` 为 `papertape run --watch` 美化终端输出。

## 第六步：注册

把适配器接入三个注册表：

1. `server/src/adapters/registry.ts`
2. `ui/src/adapters/registry.ts`
3. `cli/src/adapters/registry.ts`

## 技能注入

在不写入代理工作目录的前提下，让代理运行时能够发现 Papertape 技能：

1. **最佳方案：临时目录 + 启动参数**，创建临时目录，挂载技能符号链接，通过 CLI 参数传入，执行后清理
2. **可接受方案：全局配置目录**，把技能链接到该运行时的全局插件目录
3. **可接受方案：环境变量**，用一个技能路径环境变量指向仓库里的 `skills/` 目录
4. **最后手段：提示词注入**，把技能内容直接拼到提示词模板中

## 安全

- 把代理输出视为不可信输入（防御式解析，绝不直接执行）
- 通过环境变量注入 secrets，而不是放进提示词
- 如果运行时支持，配置网络访问控制
- 始终启用 timeout 和 grace period
