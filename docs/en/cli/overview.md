---
title: CLI Overview
summary: CLI installation and setup
---

The Swarmifyx CLI handles instance setup, diagnostics, and control-plane operations.

## Usage

```sh
pnpm swarmifyx --help
```

## Global Options

All commands support:

| Flag | Description |
|------|-------------|
| `--data-dir <path>` | Local Swarmifyx data root (isolates from `~/.swarmifyx`) |
| `--api-base <url>` | API base URL |
| `--api-key <token>` | API authentication token |
| `--context <path>` | Context file path |
| `--profile <name>` | Context profile name |
| `--json` | Output as JSON |

Company-scoped commands also accept `--company-id <id>`.

For clean local instances, pass `--data-dir` on the command you run:

```sh
pnpm swarmifyx run --data-dir ./tmp/swarmifyx-dev
```

## Context Profiles

Store defaults to avoid repeating flags:

```sh
# Set defaults
pnpm swarmifyx context set --api-base http://localhost:3100 --company-id <id>

# View current context
pnpm swarmifyx context show

# List profiles
pnpm swarmifyx context list

# Switch profile
pnpm swarmifyx context use default
```

To avoid storing secrets in context, use an env var:

```sh
pnpm swarmifyx context set --api-key-env-var-name SWARMIFYX_API_KEY
export SWARMIFYX_API_KEY=...
```

Context is stored at `~/.swarmifyx/context.json`.

## Command Categories

The CLI has two categories:

1. **[Setup commands](/en/cli/setup-commands)** — instance bootstrap, diagnostics, configuration
2. **[Control-plane commands](/en/cli/control-plane-commands)** — issues, agents, approvals, activity
