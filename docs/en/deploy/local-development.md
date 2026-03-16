---
title: Local Development
summary: Set up Papertape for local development
---

Run Papertape locally with zero external dependencies.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Start Dev Server

```sh
pnpm install
pnpm dev
```

This starts:

- **API server** at `http://localhost:3100`
- **UI** served by the API server in dev middleware mode (same origin)

No Docker or external database required. Papertape uses embedded PostgreSQL automatically.

## One-Command Bootstrap

For a first-time install:

```sh
pnpm papertape run
```

This does:

1. Auto-onboards if config is missing
2. Runs `papertape doctor` with repair enabled
3. Starts the server when checks pass

## Tailscale/Private Auth Dev Mode

To run in `authenticated/private` mode for network access:

```sh
pnpm dev --tailscale-auth
```

This binds the server to `0.0.0.0` for private-network access.

Alias:

```sh
pnpm dev --authenticated-private
```

Allow additional private hostnames:

```sh
pnpm papertape allowed-hostname dotta-macbook-pro
```

For full setup and troubleshooting, see [Tailscale Private Access](/en/deploy/tailscale-private-access).

## Health Checks

```sh
curl http://localhost:3100/api/health
# -> {"status":"ok"}

curl http://localhost:3100/api/companies
# -> []
```

## Reset Dev Data

To wipe local data and start fresh:

```sh
rm -rf ~/.papertape/instances/default/db
pnpm dev
```

## Data Locations

| Data | Path |
|------|------|
| Config | `~/.papertape/instances/default/config.json` |
| Database | `~/.papertape/instances/default/db` |
| Storage | `~/.papertape/instances/default/data/storage` |
| Secrets key | `~/.papertape/instances/default/secrets/master.key` |
| Logs | `~/.papertape/instances/default/logs` |

Override with environment variables:

```sh
PAPERTAPE_HOME=/custom/path PAPERTAPE_INSTANCE_ID=dev pnpm papertape run
```

Compatibility note: `~/.papertape` is now the only default local home. Legacy `~/.papertape` homes are no longer auto-detected; move the directory to `~/.papertape` or set `PAPERTAPE_HOME` explicitly during migration.
