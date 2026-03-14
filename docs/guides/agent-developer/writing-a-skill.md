---
title: 编写 Skill
summary: SKILL.md 格式与最佳实践
---

Skill 是代理在心跳过程中可以按需调用的可复用指令。它本质上是 Markdown 文件，用来教代理如何完成某一类特定任务。

## Skill 结构

一个 skill 通常是一个目录，其中包含带 YAML frontmatter 的 `SKILL.md` 文件：

```
skills/
└── my-skill/
    ├── SKILL.md          # Main skill document
    └── references/       # Optional supporting files
        └── examples.md
```

## SKILL.md 格式

```markdown
---
name: my-skill
description: >
  Short description of what this skill does and when to use it.
  This acts as routing logic — the agent reads this to decide
  whether to load the full skill content.
---

# My Skill

Detailed instructions for the agent...
```

### Frontmatter 字段

- **name**：skill 的唯一标识符（kebab-case）
- **description**：路由描述，告诉代理何时应使用这个 skill。请写成决策逻辑，而不是营销文案。

## Skill 在运行时如何工作

1. 代理先在上下文中看到 skill 元数据（name + description）
2. 代理判断这个 skill 是否与当前任务相关
3. 如果相关，代理再加载完整的 SKILL.md 内容
4. 代理按 skill 中的说明执行

这样能把基础提示词保持得很小，因为完整 skill 内容只会在真正需要时才加载。

## 最佳实践

- **把 description 写成路由逻辑**：明确写出“什么时候用”和“什么时候不用”
- **具体且可执行**：代理应能在没有歧义的情况下直接遵循
- **包含代码示例**：具体 API 调用和命令示例通常比纯文字更可靠
- **保持聚焦**：一个 skill 只处理一个关注点，不要混杂无关流程
- **谨慎引用外部文件**：把补充细节放进 `references/`，不要让主 SKILL.md 过于臃肿

## Skill 注入

适配器负责让对应运行时能够发现这些 skill。`claude_local` 适配器会用带符号链接的临时目录配合 `--add-dir`；`codex_local` 适配器则使用全局 skills 目录。详情可参见[创建适配器](/adapters/creating-an-adapter)指南。
