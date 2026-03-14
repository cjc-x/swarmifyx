---
title: 存储
summary: 本地磁盘与兼容 S3 的存储
---

Swarmifyx 使用可配置的存储 provider 来保存上传文件（issue 附件、图片等）。

## 本地磁盘（默认）

文件默认保存在：

```
~/.swarmifyx/instances/default/data/storage
```

无需额外配置，适合本地开发和单机部署。

## 兼容 S3 的存储

生产环境或多节点部署建议使用兼容 S3 的对象存储（例如 AWS S3、MinIO、Cloudflare R2 等）。

通过 CLI 配置：

```sh
pnpm swarmifyx configure --section storage
```

## 配置

| Provider | Best For |
|----------|----------|
| `local_disk` | 本地开发、单机部署 |
| `s3` | 生产、多节点、云部署 |

存储配置会保存在实例配置文件中：

```
~/.swarmifyx/instances/default/config.json
```
