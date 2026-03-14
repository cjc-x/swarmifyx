---
title: Local Development
summary: Set up Swarmifyx for local development
---

Run Swarmifyx locally with zero external dependencies.

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

No Docker or external database required. Swarmifyx uses embedded PostgreSQL automatically.

## One-Command Bootstrap

For a first-time install:

```sh
pnpm swarmifyx run
```

This does:

1. Auto-onboards if config is missing
2. Runs `swarmifyx doctor` with repair enabled
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
pnpm swarmifyx allowed-hostname dotta-macbook-pro
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
rm -rf ~/.swarmifyx/instances/default/db
pnpm dev
```

## Data Locations

| Data | Path |
|------|------|
| Config | `~/.swarmifyx/instances/default/config.json` |
| Database | `~/.swarmifyx/instances/default/db` |
| Storage | `~/.swarmifyx/instances/default/data/storage` |
| Secrets key | `~/.swarmifyx/instances/default/secrets/master.key` |
| Logs | `~/.swarmifyx/instances/default/logs` |

Override with environment variables:

```sh
SWARMIFYX_HOME=/custom/path SWARMIFYX_INSTANCE_ID=dev pnpm swarmifyx run
```

Compatibility note: `~/.swarmifyx` is now the only default local home. Legacy `~/.swarmifyx` homes are no longer auto-detected; move the directory to `~/.swarmifyx` or set `SWARMIFYX_HOME` explicitly during migration.
