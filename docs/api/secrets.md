---
title: Secrets
summary: Secrets CRUD
---

管理代理在环境配置中引用的加密 secrets。

## 列出 Secrets

```
GET /api/companies/{companyId}/secrets
```

返回 secret 元数据（不包含解密后的值）。

## 创建 Secret

```
POST /api/companies/{companyId}/secrets
{
  "name": "anthropic-api-key",
  "value": "sk-ant-..."
}
```

secret value 会以加密方式落盘存储。接口只会返回 secret ID 和元数据。

## 更新 Secret

```
PATCH /api/secrets/{secretId}
{
  "value": "sk-ant-new-value..."
}
```

会创建一个新的 secret 版本。引用 `"version": "latest"` 的代理会在下一次心跳时自动拿到新值。

## 在代理配置中使用 Secrets

不要把敏感值直接写在代理适配器配置里，而是引用 secret：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "type": "secret_ref",
      "secretId": "{secretId}",
      "version": "latest"
    }
  }
}
```

服务端会在运行时解析并解密 secret 引用，然后把真实值注入到代理进程环境中。
