# UI 本地化 SPEC

目标文档路径：`doc/spec/ui-localization.md`

## Summary
- 将本次需求整理为可复用的子系统规格文档，放在 `doc/spec/`，用于后续实现、测试和验收对齐。
- 范围限定为 UI 本地化与中文支持：支持 `en-US` / `zh-CN`，产品名已从papercli全面改为 `Papertape`。
- 语言切换入口放在两个位置：
  - `ui/src/components/OnboardingWizard.tsx`
  - `ui/src/components/Layout.tsx` 中深色/浅色切换按钮旁边
- 设置页不提供语言切换入口。
- 用户可见的 task description、prompt、snippet 也纳入本地化；其中 UI 文案和新增中文 README 中出现的 `https://github.com/paperclipai/paperclip` 替换为 `https://github.com/papertapeai/papertape`。

## Key Changes
- 新增浏览器级 i18n 基础设施：
  - locale 固定为 `en-US` / `zh-CN`
  - locale 优先级：`localStorage` > `navigator.language` > `en-US`
  - 存储 key 固定为 `papertape.locale`
  - 切换时同步 `document.documentElement.lang`
- 新增前端 i18n 能力：
  - 文本翻译
  - 状态/优先级标签翻译
  - 货币、日期、时间、相对时间格式化
- 全量切换用户可见 UI 文案：
  - 导航、breadcrumb、页面标题、空态、按钮、标签、placeholder、tooltip、dialog、popover、aria/title
  - 前端 fallback 错误文案
  - 前端生成的长说明文本
- Onboarding 行为：
  - 保留独立语言切换入口
  - 未编辑的默认 agent 名称、task 标题、task description 随语言切换
  - 已编辑输入不被覆盖
- 全局壳层行为：
  - 语言按钮与深浅色按钮并列显示
  - 桌面端和移动端都提供入口
  - 切换语言立即影响全局 UI，不改变当前路由或上下文
- Prompt 和链接迁移规则：
  - `DEFAULT_TASK_DESCRIPTION` 提供英文版与中文版
  - 其中 CEO persona 仓库地址改为 `https://github.com/cjc-x/companies/...`
  - 其它用户可见 prompt/snippet 中若出现 `https://github.com/paperclipai/paperclip`，统一替换为 `https://github.com/papertapeai/papertape`
  - 不修改 `@papertape/*` 包名、import path、CLI/package metadata
- 文档交付：
  - 新增 `README.zh-CN.md`
  - 内容对齐当前 `README.md`，使用 `Papertape` 品牌名
  - 中文 README 中用户可见 GitHub 链接按本次规则迁移

## Test Strategy
- 遵循测试金字塔原则，但按 feature 风险选测试，不追求 unit 数量指标；优先覆盖 locale 逻辑、语言切换行为、持久化和关键 prompt 输出。
- Unit：
  - locale 归一化
  - `localStorage` / `navigator.language` 优先级
  - 翻译命中与英文回退
  - 插值
  - 货币/日期/时间/相对时间格式化
  - prompt/snippet builder 输出
  - GitHub URL 替换规则
- Integration / render：
  - `I18nProvider` 驱动组件重渲染
  - Onboarding 切换语言后默认文案变化
  - Layout 中语言按钮与 theme toggle 并列显示
  - 点击全局语言按钮后导航、breadcrumb、title 同步变化
  - 刷新后 locale 保持
- E2E：
  - 新增 1 条 Onboarding 中文场景
  - 新增 1 条全局壳层切语言场景，验证按钮位置、文案变化和刷新后保持
- 明确避免低价值测试：
  - 不为每个翻译 key 单独写测试
  - 不做大面积 snapshot
  - 不写机械性的“某按钮存在某文案”测试
- 质量门禁固定：
  - `pnpm -r typecheck`
  - `pnpm test:run`
  - `pnpm build`

## Acceptance Criteria
- UI 支持 `en-US` 和 `zh-CN` 两种语言，默认回退为 `en-US`。
- `OnboardingWizard.tsx` 中可以切换语言。
- 全局应用壳层中可以切换语言，且按钮位于深浅色切换按钮旁边。
- 设置页中不承载语言切换入口。
- 桌面端和移动端壳层都能访问语言切换。
- 切换语言后全局立即生效，刷新后保持不变。
- `DEFAULT_TASK_DESCRIPTION` 和其它前端生成的用户可见 prompt/snippet 会随语言切换。
- UI 用户可见文本中出现的 `https://github.com/paperclipai/paperclip` 已按本次范围迁移到 `https://github.com/papertapeai/papertape`。
- breadcrumb、document title、导航、空态、时间/金额格式会随 locale 改变。
- 不引入 server/db/shared contract 变更。
- 不修改 `@papertape/*` 包名或工程内部 import。
- 自动化测试覆盖高价值的 unit / integration / e2e 场景。
- 最终交付满足质量门禁：
  - `pnpm -r typecheck`
  - `pnpm test:run`
  - `pnpm build`

## Assumptions And Defaults
- 本文档是 `doc/spec/` 下的 subsystem spec，文件名采用 `ui-localization.md`。
- “设置页”不包含语言切换；语言入口改放到全局 shell 的 theme toggle 旁边。
- 替换 `paperclipai/paperclip` GitHub 链接的范围仅限 UI 用户可见文案和新增 `README.zh-CN.md`。
- 不修改 `README.md`、`doc/` 历史文档、release notes、脚本和 CLI 元数据中的旧链接。
- 产品品牌名已全面改为 `Papertape`。

## 全局改名说明

项目已全面从 Paperclip / paperclipai 改名为 **Papertape**。

完整的改名替换规则和 merge 冲突解决规范见 [`doc/MERGE-RENAME-RULES.md`](./MERGE-RENAME-RULES.md)。
