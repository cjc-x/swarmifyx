---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `swarmifyx run`

One-command bootstrap and start:

```sh
pnpm swarmifyx run
```

Does:

1. Auto-onboards if config is missing
2. Runs `swarmifyx doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm swarmifyx run --instance dev
```

## `swarmifyx onboard`

Interactive first-time setup:

```sh
pnpm swarmifyx onboard
```

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm swarmifyx onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm swarmifyx onboard --yes
```

## `swarmifyx doctor`

Health checks with optional auto-repair:

```sh
pnpm swarmifyx doctor
pnpm swarmifyx doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `swarmifyx configure`

Update configuration sections:

```sh
pnpm swarmifyx configure --section server
pnpm swarmifyx configure --section secrets
pnpm swarmifyx configure --section storage
```

## `swarmifyx env`

Show resolved environment configuration:

```sh
pnpm swarmifyx env
```

## `swarmifyx allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm swarmifyx allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.swarmifyx/instances/default/config.json` |
| Database | `~/.swarmifyx/instances/default/db` |
| Logs | `~/.swarmifyx/instances/default/logs` |
| Storage | `~/.swarmifyx/instances/default/data/storage` |
| Secrets key | `~/.swarmifyx/instances/default/secrets/master.key` |

Override with:

```sh
PAPERCLIP_HOME=/custom/home PAPERCLIP_INSTANCE_ID=dev pnpm swarmifyx run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm swarmifyx run --data-dir ./tmp/paperclip-dev
pnpm swarmifyx doctor --data-dir ./tmp/paperclip-dev
```
