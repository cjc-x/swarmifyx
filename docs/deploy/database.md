---
title: 数据库
summary: 内嵌 PGlite、Docker Postgres 与托管数据库
---

Swarmifyx 通过 Drizzle ORM 使用 PostgreSQL。数据库有三种运行方式。

## 1. 内嵌 PostgreSQL（默认）

零配置。如果没有设置 `DATABASE_URL`，服务端会自动启动一个内嵌 PostgreSQL 实例。

```sh
pnpm dev
```

首次启动时，服务端会：

1. 创建 `~/.swarmifyx/instances/default/db/` 作为数据目录
2. 确保 `swarmifyx` 数据库存在
3. 自动执行迁移
4. 开始提供服务

数据会跨重启保留。若要重置，可执行：`rm -rf ~/.swarmifyx/instances/default/db`。

Docker 快速启动方案默认也使用内嵌 PostgreSQL。

## 2. 本地 PostgreSQL（Docker）

如果需要完整的本地 PostgreSQL 服务：

```sh
docker compose up -d
```

这会在 `localhost:5432` 启动 PostgreSQL 17。然后设置连接串：

```sh
cp .env.example .env
# DATABASE_URL=postgres://swarmifyx:swarmifyx@localhost:5432/swarmifyx
```

推送 schema：

```sh
DATABASE_URL=postgres://swarmifyx:swarmifyx@localhost:5432/swarmifyx \
  npx drizzle-kit push
```

## 3. 托管 PostgreSQL（Supabase）

生产环境建议使用 [Supabase](https://supabase.com/) 这类托管数据库。

1. 在 [database.new](https://database.new) 创建项目
2. 在 Project Settings > Database 里复制连接串
3. 在 `.env` 中设置 `DATABASE_URL`

迁移请使用 **直连**（端口 5432），应用运行请使用 **连接池**（端口 6543）。

如果使用连接池，需要禁用 prepared statements：

```ts
// packages/db/src/client.ts
export function createDb(url: string) {
  const sql = postgres(url, { prepare: false });
  return drizzlePg(sql, { schema });
}
```

## 模式切换

| `DATABASE_URL` | Mode |
|----------------|------|
| Not set | 内嵌 PostgreSQL |
| `postgres://...localhost...` | 本地 Docker PostgreSQL |
| `postgres://...supabase.com...` | 托管 Supabase |

无论使用哪种模式，Drizzle schema（`packages/db/src/schema/`）都保持一致。
