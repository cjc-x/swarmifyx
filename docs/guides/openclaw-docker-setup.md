---
title: 在 Docker 中运行 OpenClaw
summary: 在本地 Docker 环境中配置 OpenClaw，并测试 Papertape 的 OpenClaw 适配器
---

# 在 Docker 中运行 OpenClaw（本地开发）

这篇文档说明如何在 Docker 容器中运行 OpenClaw，并用于本地开发或验证 Papertape 的 OpenClaw 适配器集成。

## 自动化 Join Smoke Test（推荐先跑）

Papertape 内置了一个端到端 join smoke harness：

```bash
pnpm smoke:openclaw-join
```

它会自动完成：

- 创建 invite（`allowedJoinTypes=agent`）
- 发起 OpenClaw 代理 join 请求（`adapterType=openclaw`）
- 董事会批准
- 一次性 API key claim（包含无效 / 重放 claim 校验）
- 把 wakeup callback 投递到一个 Docker 化的 OpenClaw 风格 webhook 接收器

默认情况下，这个脚本会使用预配置好的 Docker 接收器镜像（`docker/openclaw-smoke`），因此运行是确定性的，不需要你手改 OpenClaw 配置。

权限说明：

- 这个 harness 会执行受董事会治理约束的动作（创建 invite、批准 join、唤醒新代理）。
- 在 `authenticated` 模式下，请提供 board/operator 认证；否则脚本会在早期以明确的权限错误退出。

## 一键启动 OpenClaw Gateway UI（手动 Docker 流程）

如果你想一条命令拉起 OpenClaw 并打印出可在主机浏览器中打开的 dashboard URL，可以执行：

```bash
pnpm smoke:openclaw-docker-ui
```

默认情况下，这个命令可以零参数直接运行。

它会：

- 在 `/tmp/openclaw-docker` 克隆 / 更新 `openclaw/openclaw`
- 构建 `openclaw:local`（除非设置 `OPENCLAW_BUILD=0`）
- 在 `~/.openclaw-papertape-smoke/openclaw.json` 和 Docker `.env` 中写入隔离 smoke 配置
- 把默认模型固定为 OpenAI（`openai/gpt-5.2`，并带 OpenAI fallback）
- 通过 Compose 启动 `openclaw-gateway`（包含必须的 `/tmp` tmpfs 覆盖）
- 自动探测一个从 OpenClaw Docker 容器内部可访问的 Papertape 主机 URL，并把它打印出来
- 等待健康检查通过后，输出：
  - `http://127.0.0.1:18789/#token=...`
- 默认关闭 Control UI 设备配对，以降低本地 smoke 使用门槛

常用环境变量：

- `OPENAI_API_KEY`：必填，可从环境变量或 `~/.secrets` 加载
- `OPENCLAW_DOCKER_DIR`：默认 `/tmp/openclaw-docker`
- `OPENCLAW_GATEWAY_PORT`：默认 `18789`
- `OPENCLAW_GATEWAY_TOKEN`：默认随机生成
- `OPENCLAW_BUILD=0`：跳过重新构建
- `OPENCLAW_OPEN_BROWSER=1`：在 macOS 上自动打开浏览器
- `OPENCLAW_DISABLE_DEVICE_AUTH=1`：默认值，关闭 Control UI 设备配对
- `OPENCLAW_DISABLE_DEVICE_AUTH=0`：保留配对机制
- `OPENCLAW_MODEL_PRIMARY`：默认 `openai/gpt-5.2`
- `OPENCLAW_MODEL_FALLBACK`：默认 `openai/gpt-5.2-chat-latest`
- `OPENCLAW_CONFIG_DIR`：默认 `~/.openclaw-papertape-smoke`
- `OPENCLAW_RESET_STATE=1`：默认每次运行都重置 smoke 状态，避免旧认证 / 会话残留
- `PAPERTAPE_HOST_PORT`：默认 `3100`
- `PAPERTAPE_HOST_FROM_CONTAINER`：默认 `host.docker.internal`

### Authenticated 模式

如果你的 Papertape 部署使用 `authenticated` 模式，请提供认证上下文：

```bash
PAPERTAPE_AUTH_HEADER="Bearer <token>" pnpm smoke:openclaw-join
# or
PAPERTAPE_COOKIE="your_session_cookie=..." pnpm smoke:openclaw-join
```

### 网络拓扑提示

- 本机 smoke 默认使用 `http://127.0.0.1:<port>/webhook` 作为 callback。
- 在 OpenClaw Docker 容器里，`127.0.0.1` 指向的是容器本身，而不是宿主机上的 Papertape。
- 如果 OpenClaw 在 Docker 中消费 invite / onboarding URL，请优先使用脚本打印出来的 Papertape URL（通常是 `http://host.docker.internal:3100`）。
- 如果 Papertape 因主机名校验拒绝了容器可见 host，请在宿主机上执行：

```bash
pnpm papertape allowed-hostname host.docker.internal
```

然后重启 Papertape，再重跑 smoke 脚本。

## 前置条件

- Docker Desktop v29+（并启用 Docker Sandbox 更佳）
- 至少 2 GB 可用内存用于构建镜像
- `~/.secrets` 中至少有 `OPENAI_API_KEY`

## 方案 A：Docker Sandbox（推荐）

Docker Sandbox 提供更好的隔离能力（基于 microVM），也比传统 Compose 更省心。需要 Docker Desktop v29+ / Docker Sandbox v0.12+。

```bash
# 1. 克隆 OpenClaw 仓库并构建镜像
git clone https://github.com/openclaw/openclaw.git /tmp/openclaw-docker
cd /tmp/openclaw-docker
docker build -t openclaw:local -f Dockerfile .

# 2. 用构建好的镜像创建 sandbox
docker sandbox create --name openclaw -t openclaw:local shell ~/.openclaw/workspace

# 3. 放行到 OpenAI API 的网络访问
docker sandbox network proxy openclaw \
  --allow-host api.openai.com \
  --allow-host localhost

# 4. 在 sandbox 内写入配置
docker sandbox exec openclaw sh -c '
mkdir -p /home/node/.openclaw/workspace /home/node/.openclaw/identity /home/node/.openclaw/credentials
cat > /home/node/.openclaw/openclaw.json << INNEREOF
{
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "sandbox-dev-token-12345"
    },
    "controlUi": { "enabled": true }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-5.2",
        "fallbacks": ["openai/gpt-5.2-chat-latest"]
      },
      "workspace": "/home/node/.openclaw/workspace"
    }
  }
}
INNEREOF
chmod 600 /home/node/.openclaw/openclaw.json
'

# 5. 启动 gateway（从 ~/.secrets 传入 API key）
source ~/.secrets
docker sandbox exec -d \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -w /app openclaw \
  node dist/index.js gateway --bind loopback --port 18789

# 6. 等待约 15 秒，然后验证
sleep 15
docker sandbox exec openclaw curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/
# 应输出：200

# 7. 查看状态
docker sandbox exec -e OPENAI_API_KEY="$OPENAI_API_KEY" -w /app openclaw \
  node dist/index.js status
```

### Sandbox 管理

```bash
# 列出 sandboxes
docker sandbox ls

# 进入 sandbox shell
docker sandbox exec -it openclaw bash

# 停止 sandbox（保留状态）
docker sandbox stop openclaw

# 删除 sandbox
docker sandbox rm openclaw

# 查看 sandbox 版本
docker sandbox version
```

## 方案 B：Docker Compose（兜底方案）

如果 Docker Sandbox 不可用（例如 Docker Desktop 版本低于 v29），可以使用 Docker Compose：

```bash
# 1. 克隆 OpenClaw 仓库
git clone https://github.com/openclaw/openclaw.git /tmp/openclaw-docker
cd /tmp/openclaw-docker

# 2. 构建 Docker 镜像（首次运行约 5-10 分钟）
docker build -t openclaw:local -f Dockerfile .

# 3. 创建配置目录
mkdir -p ~/.openclaw/workspace ~/.openclaw/identity ~/.openclaw/credentials
chmod 700 ~/.openclaw ~/.openclaw/credentials

# 4. 生成 gateway token
export OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
echo "Your gateway token: $OPENCLAW_GATEWAY_TOKEN"

# 5. 创建配置文件
cat > ~/.openclaw/openclaw.json << EOF
{
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$OPENCLAW_GATEWAY_TOKEN"
    },
    "controlUi": {
      "enabled": true,
      "allowedOrigins": ["http://127.0.0.1:18789"]
    }
  },
  "env": {
    "OPENAI_API_KEY": "\${OPENAI_API_KEY}"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-5.2",
        "fallbacks": ["openai/gpt-5.2-chat-latest"]
      },
      "workspace": "/home/node/.openclaw/workspace"
    }
  }
}
EOF
chmod 600 ~/.openclaw/openclaw.json

# 6. 创建 .env 文件（从 ~/.secrets 加载 API key）
source ~/.secrets
cat > .env << EOF
OPENCLAW_CONFIG_DIR=$HOME/.openclaw
OPENCLAW_WORKSPACE_DIR=$HOME/.openclaw/workspace
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_BRIDGE_PORT=18790
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_TOKEN=$OPENCLAW_GATEWAY_TOKEN
OPENCLAW_IMAGE=openclaw:local
OPENAI_API_KEY=$OPENAI_API_KEY
OPENCLAW_EXTRA_MOUNTS=
OPENCLAW_HOME_VOLUME=
OPENCLAW_DOCKER_APT_PACKAGES=
EOF

# 7. 给 docker-compose.yml 增加 tmpfs（必需）
# 对 openclaw-gateway 和 openclaw-cli 都添加：
#   tmpfs:
#     - /tmp:exec,size=512M

# 8. 启动 gateway
docker compose up -d openclaw-gateway

# 9. 等待约 15 秒，然后获取 dashboard URL
sleep 15
docker compose run --rm openclaw-cli dashboard --no-open
```

你将得到类似这样的 dashboard 地址：`http://127.0.0.1:18789/#token=<your-token>`

### Docker Compose 管理

```bash
cd /tmp/openclaw-docker

# 停止
docker compose down

# 再次启动（无需重建）
docker compose up -d openclaw-gateway

# 查看日志
docker compose logs -f openclaw-gateway

# 检查状态
docker compose run --rm openclaw-cli status

# 获取 dashboard URL
docker compose run --rm openclaw-cli dashboard --no-open
```

## 已知问题与修复

### 启动容器时提示 “no space left on device”

Docker Desktop 的虚拟磁盘很可能已经满了：

```bash
docker system df
docker system prune -f
docker image prune -f
```

### “Unable to create fallback OpenClaw temp dir: /tmp/openclaw-1000”（仅 Compose）

容器无法写入 `/tmp`。请在 `docker-compose.yml` 里给 **两个服务** 都加上 `tmpfs`：

```yaml
services:
  openclaw-gateway:
    tmpfs:
      - /tmp:exec,size=512M
  openclaw-cli:
    tmpfs:
      - /tmp:exec,size=512M
```

这个问题不会影响 Docker Sandbox 方案。

### 社区模板镜像里的 Node 版本不匹配

有些社区构建的 sandbox 模板镜像会携带 Node 20，但 OpenClaw 需要 Node >=22.12.0。建议优先使用我们本地构建的 `openclaw:local` 镜像。

### Gateway 启动后大约 15 秒才能响应

Node.js gateway 需要初始化时间。启动后先等待 15 秒，再访问 `http://127.0.0.1:18789/`。

### `CLAUDE_AI_SESSION_KEY` warning（仅 Compose）

这类 warning 通常是无害的，可以忽略：

```txt
level=warning msg="The \"CLAUDE_AI_SESSION_KEY\" variable is not set. Defaulting to a blank string."
```

## 配置

配置文件位置：`~/.openclaw/openclaw.json`（JSON5 格式）

关键配置项：

- `gateway.auth.token`：Web UI 和 API 使用的认证 token
- `agents.defaults.model.primary`：默认 AI 模型（建议 `openai/gpt-5.2` 或更新版本）
- `env.OPENAI_API_KEY`：引用 `OPENAI_API_KEY` 环境变量（Compose 方案）

API key 通常保存在 `~/.secrets` 中，并通过环境变量传入容器。

## 参考资料

- [OpenClaw Docker 文档](https://docs.openclaw.ai/install/docker)
- [OpenClaw 配置参考](https://docs.openclaw.ai/gateway/configuration-reference)
- [Docker 博文：在 Docker Sandboxes 中安全运行 OpenClaw](https://www.docker.com/blog/run-openclaw-securely-in-docker-sandboxes/)
- [Docker Sandbox 文档](https://docs.docker.com/ai/sandboxes)
- [OpenAI Models](https://platform.openai.com/docs/models)
