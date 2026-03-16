---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `papertape run`

One-command bootstrap and start:

```sh
pnpm papertape run
```

Does:

1. Auto-onboards if config is missing
2. Runs `papertape doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm papertape run --instance dev
```

## `papertape onboard`

Interactive first-time setup:

```sh
pnpm papertape onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm papertape onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm papertape onboard --yes
```

## `papertape doctor`

Health checks with optional auto-repair:

```sh
pnpm papertape doctor
pnpm papertape doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `papertape configure`

Update configuration sections:

```sh
pnpm papertape configure --section server
pnpm papertape configure --section secrets
pnpm papertape configure --section storage
```

## `papertape env`

Show resolved environment configuration:

```sh
pnpm papertape env
```

## `papertape allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm papertape allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.papertape/instances/default/config.json` |
| Database | `~/.papertape/instances/default/db` |
| Logs | `~/.papertape/instances/default/logs` |
| Storage | `~/.papertape/instances/default/data/storage` |
| Secrets key | `~/.papertape/instances/default/secrets/master.key` |

Override with:

```sh
PAPERTAPE_HOME=/custom/home PAPERTAPE_INSTANCE_ID=dev pnpm papertape run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm papertape run --data-dir ./tmp/papertape-dev
pnpm papertape doctor --data-dir ./tmp/papertape-dev
```
