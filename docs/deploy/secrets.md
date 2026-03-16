---
title: Secrets 管理
summary: 主密钥、加密与严格模式
---

Papertape 会使用本地主密钥对落盘的 secrets 进行加密。代理环境变量里的敏感值（API key、token 等）会以加密 secret 引用的形式存储。

## 默认 Provider：`local_encrypted`

secrets 会使用本地主密钥加密，密钥默认保存在：

```
~/.papertape/instances/default/secrets/master.key
```

这个密钥会在 onboarding 时自动创建，并且不会离开你的机器。

## 配置

### CLI 配置

onboarding 会写入默认的 secrets 配置：

```sh
pnpm papertape onboard
```

更新 secrets 配置：

```sh
pnpm papertape configure --section secrets
```

校验 secrets 配置：

```sh
pnpm papertape doctor
```

### 环境变量覆盖

| Variable | Description |
|----------|-------------|
| `PAPERTAPE_SECRETS_MASTER_KEY` | 32 字节密钥，支持 base64、hex 或原始字符串 |
| `PAPERTAPE_SECRETS_MASTER_KEY_FILE` | 自定义 key 文件路径 |
| `PAPERTAPE_SECRETS_STRICT_MODE` | 设为 `true` 时强制使用 secret ref |

## 严格模式

启用严格模式后，所有匹配 `*_API_KEY`、`*_TOKEN`、`*_SECRET` 的敏感环境变量都必须使用 secret 引用，而不能继续以内联明文形式出现。

```sh
PAPERTAPE_SECRETS_STRICT_MODE=true
```

建议所有超过本地可信环境的部署都开启它。

## 迁移内联 Secrets

如果你的现有代理配置里仍然内联保存着 API key，可以把它们迁移成加密 secret ref：

```sh
pnpm secrets:migrate-inline-env         # dry run
pnpm secrets:migrate-inline-env --apply # apply migration
```

## 代理配置中的 Secret 引用

代理环境变量可以像这样引用 secret：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "type": "secret_ref",
      "secretId": "8f884973-c29b-44e4-8ea3-6413437f8081",
      "version": "latest"
    }
  }
}
```

服务端会在运行时解析并解密这些引用，然后把真实值注入到代理进程环境中。
