---
title: CLI Overview
summary: CLI installation and setup
---

The Papertape CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm papertape --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Papertape data root (isolates from `~/.papertape`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm papertape run --data-dir ./tmp/papertape-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm papertape context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm papertape context show

# List profiles
pnpm papertape context list

# Switch profile
pnpm papertape context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm papertape context set --api-key-env-var-name PAPERTAPE_API_KEY
export PAPERTAPE_API_KEY=...
```

Context is stored at `~/.papertape/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/en/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/en/cli/control-plane-commands)** — issues, agents, approvals, activity
