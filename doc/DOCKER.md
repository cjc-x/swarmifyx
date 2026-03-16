# Docker Quickstart

Run Papertape in Docker without installing Node or pnpm locally.

## One-liner (build + run)

```sh
docker build -t papertape-local . && \
docker run --name papertape \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e PAPERTAPE_HOME=/papertape \
  -v "$(pwd)/data/docker-papertape:/papertape" \
  papertape-local
```

Open: `http://localhost:3100`

Data persistence:

- Embedded PostgreSQL data
- uploaded assets
- local secrets key
- local agent workspace data

All persisted under your bind mount (`./data/docker-papertape` in the example above).

## Compose Quickstart

```sh
docker compose -f docker-compose.quickstart.yml up --build
```

Defaults:

- host port: `3100`
- persistent data dir: `./data/docker-papertape`

Optional overrides:

```sh
PAPERTAPE_PORT=3200 PAPERTAPE_DATA_DIR=./data/pc docker compose -f docker-compose.quickstart.yml up --build
```

If you change host port or use a non-local domain, set `PAPERTAPE_PUBLIC_URL` to the external URL you will use in browser/auth flows.

## Authenticated Compose (Single Public URL)

For authenticated deployments, set one canonical public URL and let Papertape derive auth/callback defaults:

```yaml
services:
  papertape:
    environment:
      PAPERTAPE_DEPLOYMENT_MODE: authenticated
      PAPERTAPE_DEPLOYMENT_EXPOSURE: private
      PAPERTAPE_PUBLIC_URL: https://desk.koker.net
```

`PAPERTAPE_PUBLIC_URL` is used as the primary source for:

- auth public base URL
- Better Auth base URL defaults
- bootstrap invite URL defaults
- hostname allowlist defaults (hostname extracted from URL)

Granular overrides remain available if needed (`PAPERTAPE_AUTH_PUBLIC_BASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `PAPERTAPE_ALLOWED_HOSTNAMES`).

Set `PAPERTAPE_ALLOWED_HOSTNAMES` explicitly only when you need additional hostnames beyond the public URL host (for example Tailscale/LAN aliases or multiple private hostnames).

## Claude + Codex Local Adapters in Docker

The image pre-installs:

- `claude` (Anthropic Claude Code CLI)
- `codex` (OpenAI Codex CLI)

If you want local adapter runs inside the container, pass API keys when starting the container:

```sh
docker run --name papertape \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e PAPERTAPE_HOME=/papertape \
  -e OPENAI_API_KEY=... \
  -e ANTHROPIC_API_KEY=... \
  -v "$(pwd)/data/docker-papertape:/papertape" \
  papertape-local
```

Notes:

- Without API keys, the app still runs normally.
- Adapter environment checks in Papertape will surface missing auth/CLI prerequisites.

## Onboard Smoke Test (Ubuntu + npm only)

Use this when you want to mimic a fresh machine that only has Ubuntu + npm and verify:

- `npx papertape onboard --yes` completes
- the server binds to `0.0.0.0:3100` so host access works
- onboard/run banners and startup logs are visible in your terminal

Build + run:

```sh
./scripts/docker-onboard-smoke.sh
```

Open: `http://localhost:3131` (default smoke host port)

Useful overrides:

```sh
HOST_PORT=3200 PAPERTAPE_VERSION=latest ./scripts/docker-onboard-smoke.sh
PAPERTAPE_DEPLOYMENT_MODE=authenticated PAPERTAPE_DEPLOYMENT_EXPOSURE=private ./scripts/docker-onboard-smoke.sh
```

Notes:

- Persistent data is mounted at `./data/docker-onboard-smoke` by default.
- Container runtime user id defaults to your local `id -u` so the mounted data dir stays writable while avoiding root runtime.
- Smoke script defaults to `authenticated/private` mode so `HOST=0.0.0.0` can be exposed to the host.
- Smoke script defaults host port to `3131` to avoid conflicts with local Papertape on `3100`.
- Smoke script also defaults `PAPERTAPE_PUBLIC_URL` to `http://localhost:<HOST_PORT>` so bootstrap invite URLs and auth callbacks use the reachable host port instead of the container's internal `3100`.
- In authenticated mode, the smoke script defaults `SMOKE_AUTO_BOOTSTRAP=true` and drives the real bootstrap path automatically: it signs up a real user, runs `papertape auth bootstrap-ceo` inside the container to mint a real bootstrap invite, accepts that invite over HTTP, and verifies board session access.
- Run the script in the foreground to watch the onboarding flow; stop with `Ctrl+C` after validation.
- The image definition is in `Dockerfile.onboard-smoke`.
