---
title: Docker
summary: Docker Compose 快速启动
---

无需在本机安装 Node 或 pnpm，也能通过 Docker 运行 Swarmifyx。

## Compose 快速启动（推荐）

```sh
docker compose -f docker-compose.quickstart.yml up --build
```

Open [http://localhost:3100](http://localhost:3100).

默认值：

- 主机端口：`3100`
- 数据目录：`./data/docker-swarmifyx`

通过环境变量覆盖：

```sh
SWARMIFYX_PORT=3200 SWARMIFYX_DATA_DIR=./data/pc \
  docker compose -f docker-compose.quickstart.yml up --build
```

## 手动 Docker 构建

```sh
docker build -t swarmifyx-local .
docker run --name swarmifyx \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e SWARMIFYX_HOME=/swarmifyx \
  -v "$(pwd)/data/docker-swarmifyx:/swarmifyx" \
  swarmifyx-local
```

## 数据持久化

所有数据都会持久化到绑定挂载目录（`./data/docker-swarmifyx`）：

- 内嵌 PostgreSQL 数据
- 上传资产
- 本地 secrets key
- 代理 workspace 数据

## Docker 中的 Claude 与 Codex 适配器

Docker 镜像已经预装：

- `claude`（Anthropic Claude Code CLI）
- `codex`（OpenAI Codex CLI）

如果希望在容器内使用本地适配器运行，请传入对应 API key：

```sh
docker run --name swarmifyx \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e SWARMIFYX_HOME=/swarmifyx \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-... \
  -v "$(pwd)/data/docker-swarmifyx:/swarmifyx" \
  swarmifyx-local
```

即使不传 API key，应用本身也能正常运行；只是适配器环境检查会提示缺少前置条件。
