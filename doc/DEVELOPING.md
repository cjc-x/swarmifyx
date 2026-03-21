# Developing

This project can run fully in local dev without setting up PostgreSQL manually.

## Deployment Modes

For mode definitions and intended CLI behavior, see `doc/DEPLOYMENT-MODES.md`.

Current implementation status:

- canonical model: `local_trusted` and `authenticated` (with `private/public` exposure)

## Prerequisites

- Node.js 20+
- pnpm 9+

## Dependency Lockfile Policy

GitHub Actions owns `pnpm-lock.yaml`.

- Do not commit `pnpm-lock.yaml` in pull requests.
- Pull request CI validates dependency resolution when manifests change.
- Pushes to `master` regenerate `pnpm-lock.yaml` with `pnpm install --lockfile-only --no-frozen-lockfile`, commit it back if needed, and then run verification with `--frozen-lockfile`.

## Start Dev

From repo root:

```sh
pnpm install
pnpm dev
```

Windows native shell support:

- `pnpm dev`, `pnpm abacus ...`, `pnpm db:backup`, and `pnpm build:npm` are supported from PowerShell and `cmd.exe`
- release and smoke helpers under `scripts/*.sh` still expect a POSIX shell such as Git Bash

This starts:

- API server: `http://localhost:3100`
- UI: served by the API server in dev middleware mode (same origin as API)

## Desktop Wrapper (Windows-first)

The repo also includes a local Electron shell for desktop verification:

```sh
pnpm desktop:dev
```

Supported user-facing overrides:

```sh
ABACUS_HOME=/custom/path PORT=3210 pnpm desktop:dev
```

For a repo-owned smoke check that launches Electron with remote debugging and validates the boot handoff, run:

```sh
pnpm smoke:desktop
```

`pnpm dev` runs the server in watch mode and restarts on changes from workspace packages (including adapter packages). Use `pnpm dev:once` to run without file watching.

`pnpm dev:once` now tracks backend-relevant file changes and pending migrations. When the current boot is stale, the board UI shows a `Restart required` banner. You can also enable guarded auto-restart in `Instance Settings > Experimental`, which waits for queued/running local agent runs to finish before restarting the dev server.

Tailscale/private-auth dev mode:

```sh
pnpm dev --tailscale-auth
```

This runs dev as `authenticated/private` and binds the server to `0.0.0.0` for private-network access.

Allow additional private hostnames (for example custom Tailscale hostnames):

```sh
pnpm abacus allowed-hostname dotta-macbook-pro
```

## One-Command Local Run

For a first-time local install, you can bootstrap and run in one command:

```sh
pnpm abacus run
```

`abacus run` does:

1. auto-onboard if config is missing
2. `abacus doctor` with repair enabled
3. starts the server when checks pass

## Docker Quickstart (No local Node install)

Build and run Abacus in Docker:

```sh
docker build -t abacus-local .
docker run --name abacus \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e ABACUS_HOME=/abacus \
  -v "$(pwd)/data/docker-abacus:/abacus" \
  abacus-local
```

Or use Compose:

```sh
docker compose -f docker-compose.quickstart.yml up --build
```

See `doc/DOCKER.md` for API key wiring (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`) and persistence details.

## Docker For Untrusted PR Review

For a separate review-oriented container that keeps `codex`/`claude` login state in Docker volumes and checks out PRs into an isolated scratch workspace, see `doc/UNTRUSTED-PR-REVIEW.md`.

## Database in Dev (Auto-Handled)

For local development, leave `DATABASE_URL` unset.
The server will automatically use embedded PostgreSQL and persist data at:

- `~/.abacus/instances/default/db`

Override home and instance:

```sh
ABACUS_HOME=/custom/path ABACUS_INSTANCE_ID=dev pnpm abacus run
```

Abacus uses `~/.abacus` as the default local home. Set `ABACUS_HOME` explicitly if you want a different location.

No Docker or external database is required for this mode.

## Storage in Dev (Auto-Handled)

For local development, the default storage provider is `local_disk`, which persists uploaded images/attachments at:

- `~/.abacus/instances/default/data/storage`

Configure storage provider/settings:

```sh
pnpm abacus configure --section storage
```

## Default Agent Workspaces

When a local agent run has no resolved project/session workspace, Abacus falls back to an agent home workspace under the instance root:

- `~/.abacus/instances/default/workspaces/<agent-id>`

This path honors `ABACUS_HOME` and `ABACUS_INSTANCE_ID` in non-default setups.

For `codex_local`, Abacus also manages a per-company Codex home under the instance root and seeds it from the shared Codex login/config home (`$CODEX_HOME` or `~/.codex`):

- `~/.abacus/instances/default/companies/<company-id>/codex-home`

## Worktree-local Instances

When developing from multiple git worktrees, do not point two Abacus servers at the same embedded PostgreSQL data directory.

Instead, create a repo-local Abacus config plus an isolated instance for the worktree:

```sh
abacus worktree init
# or create the git worktree and initialize it in one step:
pnpm abacus worktree:make abacus-pr-432
```

This command:

- writes repo-local files at `.abacus/config.json` and `.abacus/.env`
- creates an isolated instance under `~/.abacus-worktrees/instances/<worktree-id>/`
- when run inside a linked git worktree, mirrors the effective git hooks into that worktree's private git dir
- picks a free app port and embedded PostgreSQL port
- by default seeds the isolated DB in `minimal` mode from your main instance via a logical SQL snapshot

Seed modes:

- `minimal` keeps core app state like companies, projects, issues, comments, approvals, and auth state, preserves schema for all tables, but omits row data from heavy operational history such as heartbeat runs, wake requests, activity logs, runtime services, and agent session state
- `full` makes a full logical clone of the source instance
- `--no-seed` creates an empty isolated instance

After `worktree init`, both the server and the CLI auto-load the repo-local `.abacus/.env` when run inside that worktree, so normal commands like `pnpm dev`, `abacus doctor`, and `abacus db:backup` stay scoped to the worktree instance.

That repo-local env also sets `ABACUS_IN_WORKTREE=true`, which the server can use for worktree-specific UI behavior such as an alternate favicon.

Print shell exports explicitly when needed:

```sh
abacus worktree env
# or:
eval "$(abacus worktree env)"
```

### Worktree CLI Reference

**`pnpm abacus worktree init [options]`** — Create repo-local config/env and an isolated instance for the current worktree.

| Option | Description |
|---|---|
| `--name <name>` | Display name used to derive the instance id |
| `--instance <id>` | Explicit isolated instance id |
| `--home <path>` | Home root for worktree instances (default: `~/.abacus-worktrees`) |
| `--from-config <path>` | Source config.json to seed from |
| `--from-data-dir <path>` | Source ABACUS_HOME used when deriving the source config |
| `--from-instance <id>` | Source instance id (default: `default`) |
| `--server-port <port>` | Preferred server port |
| `--db-port <port>` | Preferred embedded Postgres port |
| `--seed-mode <mode>` | Seed profile: `minimal` or `full` (default: `minimal`) |
| `--no-seed` | Skip database seeding from the source instance |
| `--force` | Replace existing repo-local config and isolated instance data |

Examples:

```sh
abacus worktree init --no-seed
abacus worktree init --seed-mode full
abacus worktree init --from-instance default
abacus worktree init --from-data-dir ~/.abacus
abacus worktree init --force
```

**`pnpm abacus worktree:make <name> [options]`** — Create `~/NAME` as a git worktree, then initialize an isolated Abacus instance inside it. This combines `git worktree add` with `worktree init` in a single step.

| Option | Description |
|---|---|
| `--start-point <ref>` | Remote ref to base the new branch on (e.g. `origin/main`) |
| `--instance <id>` | Explicit isolated instance id |
| `--home <path>` | Home root for worktree instances (default: `~/.abacus-worktrees`) |
| `--from-config <path>` | Source config.json to seed from |
| `--from-data-dir <path>` | Source ABACUS_HOME used when deriving the source config |
| `--from-instance <id>` | Source instance id (default: `default`) |
| `--server-port <port>` | Preferred server port |
| `--db-port <port>` | Preferred embedded Postgres port |
| `--seed-mode <mode>` | Seed profile: `minimal` or `full` (default: `minimal`) |
| `--no-seed` | Skip database seeding from the source instance |
| `--force` | Replace existing repo-local config and isolated instance data |

Examples:

```sh
pnpm abacus worktree:make abacus-pr-432
pnpm abacus worktree:make my-feature --start-point origin/main
pnpm abacus worktree:make experiment --no-seed
```

**`pnpm abacus worktree env [options]`** — Print shell exports for the current worktree-local Abacus instance.

| Option | Description |
|---|---|
| `-c, --config <path>` | Path to config file |
| `--json` | Print JSON instead of shell exports |

Examples:

```sh
pnpm abacus worktree env
pnpm abacus worktree env --json
eval "$(pnpm abacus worktree env)"
```

For project execution worktrees, Abacus can also run a project-defined provision command after it creates or reuses an isolated git worktree. Configure this on the project's execution workspace policy (`workspaceStrategy.provisionCommand`). The command runs inside the derived worktree and receives `ABACUS_WORKSPACE_*`, `ABACUS_PROJECT_ID`, `ABACUS_AGENT_ID`, and `ABACUS_ISSUE_*` environment variables so each repo can bootstrap itself however it wants.

Default execution worktrees live under `.abacus/worktrees`. If branch creation is blocked by an existing checkout, remove the stale worktree or set `workspaceStrategy.worktreeParentDir` explicitly.

## Quick Health Checks

In another terminal:

```sh
curl http://localhost:3100/api/health
curl http://localhost:3100/api/companies
```

Expected:

- `/api/health` returns `{"status":"ok"}`
- `/api/companies` returns a JSON array

## Reset Local Dev Database

To wipe local dev data and start fresh:

```sh
rm -rf ~/.abacus/instances/default/db
pnpm dev
```

## Optional: Use External Postgres

If you set `DATABASE_URL`, the server will use that instead of embedded PostgreSQL.

## Automatic DB Backups

Abacus can run automatic DB backups on a timer. Defaults:

- enabled
- every 60 minutes
- retain 30 days
- backup dir: `~/.abacus/instances/default/data/backups`

Configure these in:

```sh
pnpm abacus configure --section database
```

Run a one-off backup manually:

```sh
pnpm abacus db:backup
# or:
pnpm db:backup
```

Environment overrides:

- `ABACUS_DB_BACKUP_ENABLED=true|false`
- `ABACUS_DB_BACKUP_INTERVAL_MINUTES=<minutes>`
- `ABACUS_DB_BACKUP_RETENTION_DAYS=<days>`
- `ABACUS_DB_BACKUP_DIR=/absolute/or/~/path`

## Secrets in Dev

Agent env vars now support secret references. By default, secret values are stored with local encryption and only secret refs are persisted in agent config.

- Default local key path: `~/.abacus/instances/default/secrets/master.key`
- Override key material directly: `ABACUS_SECRETS_MASTER_KEY`
- Override key file path: `ABACUS_SECRETS_MASTER_KEY_FILE`

Strict mode (recommended outside local trusted machines):

```sh
ABACUS_SECRETS_STRICT_MODE=true
```

When strict mode is enabled, sensitive env keys (for example `*_API_KEY`, `*_TOKEN`, `*_SECRET`) must use secret references instead of inline plain values.

CLI configuration support:

- `pnpm abacus onboard` writes a default `secrets` config section (`local_encrypted`, strict mode off, key file path set) and creates a local key file when needed.
- `pnpm abacus configure --section secrets` lets you update provider/strict mode/key path and creates the local key file when needed.
- `pnpm abacus doctor` validates secrets adapter configuration and can create a missing local key file with `--repair`.

Migration helper for existing inline env secrets:

```sh
pnpm secrets:migrate-inline-env         # dry run
pnpm secrets:migrate-inline-env --apply # apply migration
```

## Company Deletion Toggle

Company deletion is intended as a dev/debug capability and can be disabled at runtime:

```sh
ABACUS_ENABLE_COMPANY_DELETION=false
```

Default behavior:

- `local_trusted`: enabled
- `authenticated`: disabled

## CLI Client Operations

Abacus CLI now includes client-side control-plane commands in addition to setup commands.

Quick examples:

```sh
pnpm abacus issue list --company-id <company-id>
pnpm abacus issue create --company-id <company-id> --title "Investigate checkout conflict"
pnpm abacus issue update <issue-id> --status in_progress --comment "Started triage"
```

Set defaults once with context profiles:

```sh
pnpm abacus context set --api-base http://localhost:3100 --company-id <company-id>
```

Then run commands without repeating flags:

```sh
pnpm abacus issue list
pnpm abacus dashboard get
```

See full command reference in `doc/CLI.md`.

## OpenClaw Invite Onboarding Endpoints

Agent-oriented invite onboarding now exposes machine-readable API docs:

- `GET /api/invites/:token` returns invite summary plus onboarding and skills index links.
- `GET /api/invites/:token/onboarding` returns onboarding manifest details (registration endpoint, claim endpoint template, skill install hints).
- `GET /api/invites/:token/onboarding.txt` returns a plain-text onboarding doc intended for both human operators and agents (llm.txt-style handoff), including optional inviter message and suggested network host candidates.
- `GET /api/skills/index` lists available skill documents.
- `GET /api/skills/abacus` returns the Abacus heartbeat skill markdown.

## OpenClaw Join Smoke Test

Run the end-to-end OpenClaw join smoke harness:

```sh
pnpm smoke:openclaw-join
```

What it validates:

- invite creation for agent-only join
- agent join request using `adapterType=openclaw`
- board approval + one-time API key claim semantics
- callback delivery on wakeup to a dockerized OpenClaw-style webhook receiver

Required permissions:

- This script performs board-governed actions (create invite, approve join, wakeup another agent).
- In authenticated mode, run with board auth via `ABACUS_AUTH_HEADER` or `ABACUS_COOKIE`.

Optional auth flags (for authenticated mode):

- `ABACUS_AUTH_HEADER` (for example `Bearer ...`)
- `ABACUS_COOKIE` (session cookie header value)

## OpenClaw Docker UI One-Command Script

To boot OpenClaw in Docker and print a host-browser dashboard URL in one command:

```sh
pnpm smoke:openclaw-docker-ui
```

This script lives at `scripts/smoke/openclaw-docker-ui.sh` and automates clone/build/config/start for Compose-based local OpenClaw UI testing.

Pairing behavior for this smoke script:

- default `OPENCLAW_DISABLE_DEVICE_AUTH=1` (no Control UI pairing prompt for local smoke; no extra pairing env vars required)
- set `OPENCLAW_DISABLE_DEVICE_AUTH=0` to require standard device pairing

Model behavior for this smoke script:

- defaults to OpenAI models (`openai/gpt-5.2` + OpenAI fallback) so it does not require Anthropic auth by default

State behavior for this smoke script:

- defaults to isolated config dir `~/.openclaw-abacus-smoke`
- resets smoke agent state each run by default (`OPENCLAW_RESET_STATE=1`) to avoid stale provider/auth drift

Networking behavior for this smoke script:

- auto-detects and prints a Abacus host URL reachable from inside OpenClaw Docker
- default container-side host alias is `host.docker.internal` (override with `ABACUS_HOST_FROM_CONTAINER` / `ABACUS_HOST_PORT`)
- if Abacus rejects container hostnames in authenticated/private mode, allow `host.docker.internal` via `pnpm abacus allowed-hostname host.docker.internal` and restart Abacus
