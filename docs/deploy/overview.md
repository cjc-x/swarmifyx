---
title: 部署概览
summary: 快速了解部署模式
---

Swarmifyx 支持三种部署配置，覆盖从零摩擦本地开发到面向公网的生产环境。

## 部署模式

| Mode | Auth | Best For |
|------|------|----------|
| `local_trusted` | 不需要登录 | 单人本地机器 |
| `authenticated` + `private` | 需要登录 | 私有网络（Tailscale、VPN、LAN） |
| `authenticated` + `public` | 需要登录 | 面向公网的云部署 |

## 快速对比

### Local Trusted（默认）

- 只绑定回环地址（localhost）
- 没有人类登录流程
- 本地启动最快
- 最适合：个人开发与实验

### Authenticated + Private

- 通过 Better Auth 登录
- 绑定所有网卡接口，支持网络访问
- 自动 base URL 模式，摩擦更小
- 最适合：团队通过 Tailscale 或局域网访问

### Authenticated + Public

- 需要登录
- 必须显式配置公网 URL
- 安全检查更严格
- 最适合：云托管和公网部署

## 如何选择模式

- **只是想试试 Swarmifyx？** 用 `local_trusted`（默认）
- **要在私有网络里和团队共享？** 用 `authenticated` + `private`
- **要部署到云上？** 用 `authenticated` + `public`

在 onboarding 阶段设置模式：

```sh
pnpm swarmifyx onboard
```

或者稍后再改：

```sh
pnpm swarmifyx configure --section server
```
