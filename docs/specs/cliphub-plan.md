---
title: ClipHub 方案
summary: 面向 Swarmifyx 团队蓝图、技能与治理模板的 Marketplace 规划
---

# ClipHub：Swarmifyx 团队配置 Marketplace

> 一个面向“整家公司 AI 团队配置”的应用商店。它售卖可直接安装到 Swarmifyx 公司的团队蓝图、代理蓝图、技能与治理模板。

## 1. 愿景与定位

ClipHub 的目标不是卖单个 prompt，而是卖 **整套可运行的团队配置**：

- 组织架构
- 代理角色
- 代理之间的协作流程
- 治理规则
- 项目模板

它面向的买家通常是：

- 创始人
- 团队负责人
- 想快速搭起 AI 公司 / AI 团队的操作者

核心价值主张：

> “跳过组织设计，几分钟内获得一支能直接开工的团队。”

| 维度 | ClipHub |
|---|---|
| 销售单位 | 团队蓝图（多代理组织） |
| 买家 | 想快速搭建 AI 公司的创始人 / 团队负责人 |
| 安装目标 | Swarmifyx 公司（代理、项目、治理） |
| 价值主张 | 快速获得可交付的团队配置 |
| 价格区间 | `$0–$499`，并支持单项附加组件 |

---

## 2. 产品分类

## 2.1 团队蓝图（核心产品）

完整的 Swarmifyx 公司配置，包括：

- **组织架构**：角色、title、汇报关系、能力描述
- **代理配置**：适配器类型、模型、提示词模板、指令路径
- **治理规则**：审批流、预算、升级链
- **项目模板**：带 workspace 配置的预设项目
- **技能与指令**：随代理一起打包的 `AGENTS.md` / skill 文件

示例：

- “SaaS Startup Team”
- “Content Agency”
- “Dev Shop”
- “Solo Founder + Crew”

## 2.2 代理蓝图

单个代理配置，可插入现有 Swarmifyx 组织：

- 角色定义
- 提示词模板
- 适配器配置
- 汇报关系预期
- skill 组合
- 默认治理参数

示例：

- “Staff Engineer”
- “Growth Marketer”
- “DevOps Agent”

## 2.3 Skills

可移植、可复用的 skill 包：

- Markdown skill 文件
- 工具配置与脚本
- 与 Swarmifyx skill 加载系统兼容

## 2.4 治理模板

预构建的审批流与策略包：

- 预算阈值与审批链
- 跨团队委派规则
- 升级处理流程
- 计费编码结构

---

## 3. 数据模型

## 3.1 Listing

每个 Marketplace 商品的基础记录应包含：

- 基本信息：`id`、`slug`、`type`、`title`、`tagline`、`description`
- 定价：`price`、`currency`
- 创作者：`creatorId`、`creatorName`、`creatorAvatar`
- 分类：`categories`、`tags`、`agentCount`
- 内容：预览图、README、打包文件清单
- 兼容性：支持的适配器、要求模型、最低 Swarmifyx 版本
- 社会证明：安装量、评分、评论数
- 元数据：版本、发布时间、更新时间、状态

建议类型：

```ts
type ListingType =
  | "team_blueprint"
  | "agent_blueprint"
  | "skill"
  | "governance_template";
```

## 3.2 Team Blueprint Bundle

团队蓝图应包含：

- `agents`：代理蓝图列表
- `reportingChain`：谁向谁汇报
- `governance`：审批规则、预算默认值、升级链
- `projects`：项目模板
- `companyDefaults`：公司层默认配置

每个 `AgentBlueprint` 至少应具备：

- `slug`
- `name`
- `role`
- `title`
- `capabilities`
- `promptTemplate`
- `adapterType`
- `adapterConfig`
- `instructionsPath`
- `skills`
- `budgetMonthlyCents`
- `permissions`

## 3.3 Creator / Seller

创作者资料建议包含：

- 基本信息：`displayName`、`bio`、`avatarUrl`、`website`
- 作品列表：`listings`
- 商业数据：`totalInstalls`、`totalRevenue`
- 身份状态：`verified`
- 打款信息：`payoutMethod`、`stripeAccountId`

## 3.4 Purchase / Install

购买记录至少应记录：

- `listingId`
- `buyerUserId`
- `buyerCompanyId`
- `pricePaidCents`
- `paymentIntentId`
- `installedAt`
- `status`

## 3.5 Review

评论记录建议包含：

- `listingId`
- `authorUserId`
- `rating`
- `title`
- `body`
- `verifiedPurchase`
- `createdAt` / `updatedAt`

---

## 4. 页面与路由

## 4.1 公共页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | Hero、精选蓝图、热门技能、工作原理 |
| `/browse` | Marketplace 浏览页 | 支持筛选与排序 |
| `/browse?type=team_blueprint` | 团队蓝图 | 只看团队配置 |
| `/browse?type=agent_blueprint` | 代理蓝图 | 只看单代理配置 |
| `/browse?type=skill` | Skills | 只看 skill |
| `/browse?type=governance_template` | 治理模板 | 只看治理策略 |
| `/listings/:slug` | Listing 详情页 | 完整商品页 |
| `/creators/:slug` | 创作者页 | Bio、作品、统计 |
| `/about` | 关于 | ClipHub 定位与使命 |
| `/pricing` | 定价页 | 平台抽成和买家说明 |

## 4.2 认证后页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/dashboard` | 买家仪表盘 | 已购买与已安装内容 |
| `/dashboard/purchases` | 购买记录 | 所有交易 |
| `/dashboard/installs` | 安装记录 | 已部署蓝图及状态 |
| `/creator` | 创作者面板 | 管理 listing 与查看数据 |
| `/creator/listings/new` | 创建 listing | 多步骤发布向导 |
| `/creator/listings/:id/edit` | 编辑 listing | 修改已发布内容 |
| `/creator/analytics` | 数据分析 | 收入、安装、浏览 |
| `/creator/payouts` | 打款记录 | Stripe Connect 打款历史 |

## 4.3 API 路由

建议 API：

- `GET /api/listings`
- `GET /api/listings/:slug`
- `POST /api/listings`
- `PATCH /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST /api/listings/:id/purchase`
- `POST /api/listings/:id/install`
- `GET /api/listings/:id/reviews`
- `POST /api/listings/:id/reviews`
- `GET /api/creators/:slug`
- `GET /api/creators/me`
- `POST /api/creators`
- `GET /api/purchases`
- `GET /api/analytics`

---

## 5. 用户流程

## 5.1 买家：浏览 → 购买 → 安装

```txt
首页
  -> 浏览 Marketplace
  -> 按类型 / 分类筛选
  -> 查看 listing 详情、评论、组织图预览
  -> 点击购买（或免费安装）
  -> 购买完成后点击 “Install to Company”
  -> 选择目标 Swarmifyx 公司（或新建）
  -> ClipHub 调用 Swarmifyx API：
       1. 创建代理
       2. 建立汇报关系
       3. 创建项目与 workspace
       4. 应用治理规则
       5. 部署 skills 与指令文件
  -> 跳转回 Swarmifyx，看到新团队已就位
```

## 5.2 创作者：构建 → 发布 → 变现

```txt
注册为创作者
  -> 连接 Stripe
  -> 进入 “New Listing” 向导
  -> 填写类型、基础信息、上传 bundle、预览、定价
  -> 发布
  -> 在 Creator Dashboard 中查看安装量、收入和评论
```

## 5.3 从 Swarmifyx 导出并发布

```txt
在运行中的 Swarmifyx 公司中执行“Export as Blueprint”
  -> 导出代理配置（去敏感信息）
  -> 导出组织结构、治理规则、项目模板、skill 文件
  -> 上传到 ClipHub
  -> 编辑 listing 信息并发布
```

---

## 6. UI 设计方向

## 6.1 视觉语言

- 深墨色主色调
- 温暖浅底色
- CTA 使用品牌强调色
- 清晰无衬线字体体系
- 技术细节使用等宽字体

## 6.2 关键设计元素

| 元素 | 方向 |
|---|---|
| 商品卡片 | 迷你组织图预览 + 代理数量 |
| 详情页 | 交互式组织图 + 每个代理的展开说明 |
| 安装流程 | 一键部署到 Swarmifyx 公司 |
| 社会证明 | “已有 X 家公司在运行这个蓝图” |
| 预览 | 可选 live demo sandbox |

## 6.3 Listing Card

建议展示：

- 迷你 org chart
- 标题与 tagline
- 代理数量、安装量、评分
- 创作者信息
- 价格与购买按钮

## 6.4 详情页结构

建议分区：

1. Hero：标题、tagline、价格、安装按钮、创作者信息
2. 组织图：团队层级可视化
3. 代理拆解：每个代理的角色、能力、模型、skills
4. 治理规则：审批流、预算、升级链
5. 项目模板：预设项目与 workspace
6. README：完整说明文档
7. Reviews：评分与评论
8. Related：相似蓝图推荐
9. Creator：创作者简介与其他作品

---

## 7. 安装机制

## 7.1 Install API Flow

安装请求建议形态：

```json
{
  "targetCompanyId": "uuid",
  "overrides": {
    "agentModel": "claude-sonnet-4-6",
    "budgetScale": 0.5,
    "skipProjects": false
  }
}
```

安装处理器应执行：

1. 校验买家拥有该购买记录
2. 校验买家对目标公司有访问权限
3. 为蓝图中的每个代理创建对应代理对象
4. 设置汇报关系
5. 创建项目与 workspace
6. 应用治理规则
7. 部署 skill 文件与指令路径
8. 返回创建结果摘要

## 7.2 冲突处理

- **代理重名**：自动追加 `-2`、`-3`
- **项目重名**：提示买家 rename 或 skip
- **适配器不可用**：安装前发出 warning
- **模型不可用**：提示 required model 未配置

---

## 8. 收入模型

| 项目 | 金额 | 说明 |
|---|---|---|
| 创作者分成 | 销售价的 90% | 另扣 Stripe 手续费 |
| 平台抽成 | 销售价的 10% | ClipHub 收入 |
| 免费 listing | `$0` | 无平台费用 |
| Stripe Connect | 标准费率 | 由 Stripe 处理 |

---

## 9. 技术架构

## 9.1 技术栈

- 前端：Next.js + Tailwind CSS
- 后端：Node.js API（或直接扩展 Swarmifyx server）
- 数据库：Postgres
- 支付：Stripe Connect（Marketplace 模式）
- 存储：S3 / R2
- 认证：可复用 Swarmifyx auth，或通过 OAuth2 对接

## 9.2 与 Swarmifyx 的集成方式

两种选择：

- **Option A**：独立应用，通过 API 调用 Swarmifyx 完成安装
- **Option B**：直接作为 Swarmifyx UI 的内置模块（如 `/marketplace`）

MVP 更适合 **Option B**，因为它最简单、上下文最连贯。

## 9.3 Bundle 格式

建议 listing bundle 使用 ZIP / tar 归档，内容包含：

```txt
blueprint/
├── manifest.json
├── README.md
├── org-chart.json
├── governance.json
├── agents/
│   ├── ceo/
│   │   ├── prompt.md
│   │   ├── AGENTS.md
│   │   └── skills/
│   ├── cto/
│   └── engineer/
└── projects/
    └── default/
        └── workspace.json
```

---

## 10. MVP 范围

## Phase 1：基础能力

- [ ] Listing schema 与 CRUD API
- [ ] 带筛选的 Browse 页面
- [ ] 含 org chart 的 Listing 详情页
- [ ] 创作者注册与 listing 创建向导
- [ ] 仅支持免费安装
- [ ] 蓝图安装到 Swarmifyx 公司

## Phase 2：支付与社会证明

- [ ] Stripe Connect 集成
- [ ] 购买流程
- [ ] 评论系统
- [ ] 创作者分析面板
- [ ] “从 Swarmifyx 导出” CLI 命令

## Phase 3：增长能力

- [ ] 搜索与相关性排序
- [ ] Featured / Trending 列表
- [ ] 创作者认证计划
- [ ] 蓝图版本化与更新提醒
- [ ] Live demo sandbox
- [ ] 程序化发布 API
