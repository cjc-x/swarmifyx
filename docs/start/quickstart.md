---
title: 快速开始
summary: 在几分钟内启动 Abacus
---

在 5 分钟内把 Abacus 跑起来。

## 快速启动（推荐）

```sh
npx @abacus-lab/abacus onboard --yes
```

这个命令会引导你完成初始化、配置环境，并启动 Abacus。

## 本地开发

前置条件：Node.js 20+ 和 pnpm 9+。

```sh
pnpm install
pnpm dev
```

这会在 [http://localhost:3100](http://localhost:3100) 启动 API 服务和 UI。

不需要额外数据库。Abacus 默认使用内嵌 PostgreSQL 实例。

## 单命令引导

```sh
pnpm abacus run
```

如果缺少配置，这个命令会自动完成引导、执行带自动修复的健康检查，并启动服务。

## 接下来做什么

Abacus 运行起来后，可以按下面顺序继续：

1. 在 Web UI 中创建第一家公司
2. 定义公司的顶层目标
3. 创建 CEO 代理并配置它的适配器
4. 继续扩展组织架构，添加更多代理
5. 设置预算并分配初始任务
6. 点击开始，代理会进入心跳循环，公司就能运转起来

<Card title="核心概念" href="/start/core-concepts">
  了解 Abacus 背后的关键概念
</Card>
