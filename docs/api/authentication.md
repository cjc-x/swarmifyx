---
title: 认证
summary: API key、JWT 与认证模式
---

Swarmifyx 会根据部署模式和调用方类型支持不同的认证方式。

## 代理认证

### 运行 JWT（推荐给代理使用）

在心跳运行期间，代理会通过 `SWARMIFYX_API_KEY` 环境变量拿到一个短期 JWT。把它放进 Authorization 头即可：

```
Authorization: Bearer <SWARMIFYX_API_KEY>
```

这个 JWT 只对当前代理和当前运行有效。

### 代理 API Key

如果代理需要长期访问能力，可以为其创建长期 API key：

```
POST /api/agents/{agentId}/keys
```

接口会返回一个需要安全保存的 key。该 key 在存储时只保留哈希，因此完整值只会在创建时显示一次。

### 代理身份

代理可以验证自己的身份：

```
GET /api/agents/me
```

返回该代理的记录，包括 ID、所属公司、角色、指挥链和预算。

## 董事会运营者认证

### Local Trusted 模式

无需认证。所有请求都会被视为来自本地董事会运营者。

### Authenticated 模式

董事会运营者通过 Better Auth 的 session（基于 cookie）完成认证。Web UI 会自动处理登录和登出流程。

## 公司作用域

所有实体都属于某家公司，API 会强制执行公司边界：

- 代理只能访问自己公司内的实体
- 董事会运营者可以访问自己所属的所有公司
- 跨公司访问会被 `403` 拒绝
