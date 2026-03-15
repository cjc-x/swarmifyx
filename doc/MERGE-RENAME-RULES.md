# Merge 改名冲突解决规范

## 背景

本仓库是上游 `paperclipai/paperclip` 的私有 fork，已全面改名为 **Swarmifyx**。

| 角色 | 仓库地址 |
|---|---|
| 上游（upstream） | `https://github.com/paperclipai/paperclip` |
| 私仓（origin） | `https://github.com/cjc-x/swarmifyx` |

从 `upstream/master` 拉取更新并 merge 到本地时，上游代码中仍然使用 `paperclipai` / `Paperclip` 等旧名称，与本仓库已完成的改名产生冲突。本文档定义解决这类冲突的唯一权威规则。

> [!CAUTION]
> **解决冲突时必须以本文档为准。** 任何 LLM 或自动化工具在合并代码时，遇到新旧名称冲突，一律按本文档规则将上游名称替换为对应的新名称。

---

## 字符串替换规则

按以下表格执行**全局、无例外**的替换：

| 上游原名 | 本仓库新名 | 典型出现位置 |
|---|---|---|
| `paperclipai` | `swarmifyx` | npm scope、import path、GitHub org/URL、CLI 命令名、CSS 类名、URL slug |
| `Paperclipai` | `Swarmifyx` | 类名、组件名、品牌展示（Pascal/Title case） |
| `PAPERCLIPAI` | `SWARMIFYX` | 环境变量、常量定义（全大写） |
| `papercli` | `swarmifyx` | 旧缩写小写残留（CLI 名等） |
| `Papercli` | `Swarmifyx` | 旧缩写首字母大写残留 |
| `PAPERCLI` | `SWARMIFYX` | 旧缩写全大写残留 |
| `Paperclip`（独立品牌名） | `Swarmifyx` | 文档标题、UI 文案、README、注释中的产品名 |
| `paperclip`（独立小写） | `swarmifyx` | CLI 二进制名、文档正文小写引用、配置文件值 |

> [!IMPORTANT]
> 替换时注意大小写精确匹配。从上到下逐条检查，优先匹配更长的模式（如 `paperclipai` 优先于 `paperclip`）。

---

## 冲突解决行为指令

当 merge 产生冲突或上游引入新代码时，遵守以下规则：

### 1. 代码文件（`.ts` / `.tsx` / `.js` / `.mjs` / `.css` 等）

- 上游新增或修改的文件中出现任何上述旧名称 → **全部替换为新名称**
- `@paperclipai/*` 包 scope → 替换为 `@swarmifyx/*`
- import 路径中的 `@paperclipai/` → 替换为 `@swarmifyx/`
- 冲突双方都修改了同一位置：以**本仓库的新名称**为准，同时保留上游的逻辑变更

### 2. `package.json` 文件

- `"name"` 字段：以本仓库为准（已改为 `swarmifyx` 或 `@swarmifyx/*`）
- `"repository"` 字段：使用 `https://github.com/cjc-x/swarmifyx`
- 依赖名中的 `@paperclipai/*` → 替换为 `@swarmifyx/*`
- 版本号冲突：取上游较新的版本号

### 3. 文档文件（`.md`）

- 用户可见的品牌名 `Paperclip` → `Swarmifyx`
- GitHub 链接 `github.com/paperclipai/paperclip` → `github.com/cjc-x/swarmifyx`
- GitHub 链接 `github.com/paperclipai/` → `github.com/cjc-x/`
- 文档中引用的 CLI 命令名遵循替换表

### 4. 配置文件（`drizzle.config.ts`、`.env` 模板等）

- 环境变量名中的 `PAPERCLIP` / `PAPERCLIPAI` → 替换为 `SWARMIFYX`
- 配置值中的旧名称 → 按替换表替换

### 5. 不替换的例外

以下情况**保留上游原名，不做替换**：

- "Forked from paperclip" 等标注 fork 来源的信息（README、GitHub 描述等）
- 上游 commit hash、commit message 引用（只读历史）
- 上游 CHANGELOG / release notes 中对旧版本的历史引用
- 第三方依赖名称（如 npm 包名不属于本项目的）
- 注释中明确标注 "upstream reference" 的原文引用

---

## 合并后验证

每次从上游 merge 后，必须通过以下检查：

```sh
# 确认无旧名称残留（排除本文档自身和 git 历史）
git diff --name-only HEAD | xargs grep -l -i "paperclipai\|papercli" -- 2>/dev/null

# 质量门禁
pnpm -r typecheck
pnpm test:run
pnpm build
```

如果 grep 发现残留的旧名称，按替换表修正后再提交。

---

## 本地化相关补充

UI 本地化的详细 spec 见 [`doc/ui-localization.md`](./ui-localization.md)，其中涉及：
- `localStorage` key 使用 `swarmifyx.locale`
- `DEFAULT_TASK_DESCRIPTION` 的 CEO persona 仓库地址使用 `github.com/cjc-x/companies/...`
- UI 用户可见链接中 `github.com/paperclipai/` → `github.com/cjc-x/`
