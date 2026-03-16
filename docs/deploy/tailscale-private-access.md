---
title: Tailscale 私网访问
summary: 以适合 Tailscale 的主机绑定方式运行 Papertape，并从其他设备访问
---

如果你想通过 Tailscale（或私有 LAN / VPN）访问 Papertape，而不是只在 `localhost` 上使用，就适合看这一页。

## 1. 以私网认证模式启动 Papertape

```sh
pnpm dev --tailscale-auth
```

这个命令会配置：

- `PAPERTAPE_DEPLOYMENT_MODE=authenticated`
- `PAPERTAPE_DEPLOYMENT_EXPOSURE=private`
- `PAPERTAPE_AUTH_BASE_URL_MODE=auto`
- `HOST=0.0.0.0`（绑定所有网卡接口）

等价参数：

```sh
pnpm dev --authenticated-private
```

## 2. 找到你可访问的 Tailscale 地址

在运行 Papertape 的机器上执行：

```sh
tailscale ip -4
```

你也可以使用 Tailscale 的 MagicDNS 主机名，例如 `my-macbook.tailnet.ts.net`。

## 3. 从另一台设备打开 Papertape

把 Tailscale IP 或 MagicDNS 主机名与 Papertape 端口组合使用：

```txt
http://<tailscale-host-or-ip>:3100
```

Example:

```txt
http://my-macbook.tailnet.ts.net:3100
```

## 4. 按需允许自定义私有主机名

如果你使用自定义私有主机名访问 Papertape，请把它加入 allowlist：

```sh
pnpm papertape allowed-hostname my-macbook.tailnet.ts.net
```

## 5. 验证服务可达

在另一台接入同一 Tailscale 网络的设备上执行：

```sh
curl http://<tailscale-host-or-ip>:3100/api/health
```

预期结果：

```json
{"status":"ok"}
```

## 排障

- 私有主机名下出现登录或重定向错误：用 `papertape allowed-hostname` 把它加入允许列表。
- 应用只能在 `localhost` 访问：确认你是用 `--tailscale-auth` 启动的，或者在 private 模式下显式设置了 `HOST=0.0.0.0`。
- 本机能访问但远端不行：确认两台设备都在同一个 Tailscale 网络中，并且端口 `3100` 可达。
