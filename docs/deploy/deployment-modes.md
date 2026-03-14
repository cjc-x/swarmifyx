---
title: 部署模式
summary: local_trusted 与 authenticated（private/public）
---

Swarmifyx 支持两种运行模式，对应不同的安全配置。

## `local_trusted`

默认模式，针对单人本地使用做了优化。

- **Host 绑定**：仅回环地址（localhost）
- **认证**：无需登录
- **适用场景**：本地开发、个人实验
- **董事会身份**：自动创建本地董事会用户

```sh
# Set during onboard
pnpm swarmifyx onboard
# Choose "local_trusted"
```

## `authenticated`

需要登录，并支持两种暴露策略。

### `authenticated` + `private`

用于私有网络访问（Tailscale、VPN、局域网）。

- **认证**：通过 Better Auth 登录
- **URL 处理**：自动 base URL 模式，摩擦更低
- **Host 信任**：要求启用私有主机信任策略

```sh
pnpm swarmifyx onboard
# Choose "authenticated" -> "private"
```

允许自定义 Tailscale 主机名：

```sh
pnpm swarmifyx allowed-hostname my-machine
```

### `authenticated` + `public`

用于公网部署。

- **认证**：需要登录
- **URL**：必须显式配置公网 URL
- **安全**：`doctor` 中的部署检查更严格

```sh
pnpm swarmifyx onboard
# Choose "authenticated" -> "public"
```

## 董事会认领流程

从 `local_trusted` 迁移到 `authenticated` 时，Swarmifyx 会在启动时输出一个一次性的认领 URL：

```
/board-claim/<token>?code=<code>
```

已登录用户访问该 URL 后可以认领董事会所有权。这个流程会：

- 把当前用户提升为实例管理员
- 降级自动创建的本地董事会管理员
- 确保认领用户拥有有效的公司成员身份

## 切换模式

更新部署模式：

```sh
pnpm swarmifyx configure --section server
```

也可以通过环境变量在运行时覆盖：

```sh
SWARMIFYX_DEPLOYMENT_MODE=authenticated pnpm swarmifyx run
```
