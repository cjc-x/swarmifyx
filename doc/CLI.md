# CLI Reference

Papertape CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm papertape --help
```

First-time local bootstrap + run:

```sh
pnpm papertape run
```

Choose local instance:

```sh
pnpm papertape run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `papertape onboard` and `papertape configure --section server` set deployment mode in config
- runtime can override mode with `PAPERTAPE_DEPLOYMENT_MODE`
- `papertape run` and `papertape doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm papertape allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.papertape`:

```sh
pnpm papertape run --data-dir ./tmp/papertape-dev
pnpm papertape issue list --data-dir ./tmp/papertape-dev
```

## Context Profiles

Store local defaults in `~/.papertape/context.json`:

```sh
pnpm papertape context set --api-base http://localhost:3100 --company-id <company-id>
pnpm papertape context show
pnpm papertape context list
pnpm papertape context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm papertape context set --api-key-env-var-name PAPERTAPE_API_KEY
export PAPERTAPE_API_KEY=...
```

## Company Commands

```sh
pnpm papertape company list
pnpm papertape company get <company-id>
pnpm papertape company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm papertape company delete PAP --yes --confirm PAP
pnpm papertape company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `PAPERTAPE_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `PAPERTAPE_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm papertape issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm papertape issue get <issue-id-or-identifier>
pnpm papertape issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm papertape issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm papertape issue comment <issue-id> --body "..." [--reopen]
pnpm papertape issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm papertape issue release <issue-id>
```

## Agent Commands

```sh
pnpm papertape agent list --company-id <company-id>
pnpm papertape agent get <agent-id>
pnpm papertape agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Papertape agent:

- creates a new long-lived agent API key
- installs missing Papertape skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `PAPERTAPE_API_URL`, `PAPERTAPE_COMPANY_ID`, `PAPERTAPE_AGENT_ID`, and `PAPERTAPE_API_KEY`

Example for shortname-based local setup:

```sh
pnpm papertape agent local-cli codexcoder --company-id <company-id>
pnpm papertape agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm papertape approval list --company-id <company-id> [--status pending]
pnpm papertape approval get <approval-id>
pnpm papertape approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm papertape approval approve <approval-id> [--decision-note "..."]
pnpm papertape approval reject <approval-id> [--decision-note "..."]
pnpm papertape approval request-revision <approval-id> [--decision-note "..."]
pnpm papertape approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm papertape approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm papertape activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm papertape dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm papertape heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.papertape/instances/default`:

- config: `~/.papertape/instances/default/config.json`
- embedded db: `~/.papertape/instances/default/db`
- logs: `~/.papertape/instances/default/logs`
- storage: `~/.papertape/instances/default/data/storage`
- secrets key: `~/.papertape/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
PAPERTAPE_HOME=/custom/home PAPERTAPE_INSTANCE_ID=dev pnpm papertape run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm papertape configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
