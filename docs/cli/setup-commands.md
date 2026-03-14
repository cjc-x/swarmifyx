---
title: 初始化命令
summary: onboard、run、doctor 和 configure
---

用于实例初始化和诊断的命令。

## `swarmifyx run`

单命令引导并启动：

```sh
pnpm swarmifyx run
```

它会：

1. 在缺少配置时自动完成引导
2. 运行启用修复能力的 `swarmifyx doctor`
3. 在检查通过后启动服务

指定某个实例：

```sh
pnpm swarmifyx run --instance dev
```

## `swarmifyx onboard`

首次交互式初始化：

```sh
pnpm swarmifyx onboard
```

第一步会让你选择：

1. `Quickstart`（推荐）：使用本地默认配置（内嵌数据库、无 LLM provider、本地磁盘存储、默认 secrets）
2. `Advanced setup`：完整的交互式配置流程

引导结束后立刻启动：

```sh
pnpm swarmifyx onboard --run
```

使用非交互默认值并立即启动（服务监听后会打开浏览器）：

```sh
pnpm swarmifyx onboard --yes
```

## `swarmifyx doctor`

带可选自动修复的健康检查：

```sh
pnpm swarmifyx doctor
pnpm swarmifyx doctor --repair
```

检查内容包括：

- 服务端配置
- 数据库连通性
- secrets 适配器配置
- 存储配置
- 缺失的 key 文件

## `swarmifyx configure`

更新配置分区：

```sh
pnpm swarmifyx configure --section server
pnpm swarmifyx configure --section secrets
pnpm swarmifyx configure --section storage
```

## `swarmifyx env`

显示解析后的环境配置：

```sh
pnpm swarmifyx env
```

## `swarmifyx allowed-hostname`

为 authenticated/private 模式放行私有主机名：

```sh
pnpm swarmifyx allowed-hostname my-tailscale-host
```

## 本地存储路径

| Data | Default Path |
|------|-------------|
| 配置 | `~/.swarmifyx/instances/default/config.json` |
| 数据库 | `~/.swarmifyx/instances/default/db` |
| 日志 | `~/.swarmifyx/instances/default/logs` |
| 存储 | `~/.swarmifyx/instances/default/data/storage` |
| Secrets key | `~/.swarmifyx/instances/default/secrets/master.key` |

可以通过下面的方式覆盖：

```sh
SWARMIFYX_HOME=/custom/home SWARMIFYX_INSTANCE_ID=dev pnpm swarmifyx run
```

也可以直接在任意命令上加 `--data-dir`：

```sh
pnpm swarmifyx run --data-dir ./tmp/swarmifyx-dev
pnpm swarmifyx doctor --data-dir ./tmp/swarmifyx-dev
```
