---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Papertape uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `PAPERTAPE_HOME` | `~/.papertape` | Base directory for all Papertape data |
| `PAPERTAPE_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `PAPERTAPE_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERTAPE_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `PAPERTAPE_SECRETS_MASTER_KEY_FILE` | `~/.papertape/.../secrets/master.key` | Path to key file |
| `PAPERTAPE_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `PAPERTAPE_AGENT_ID` | Agent's unique ID |
| `PAPERTAPE_COMPANY_ID` | Company ID |
| `PAPERTAPE_API_URL` | Papertape API base URL |
| `PAPERTAPE_API_KEY` | Short-lived JWT for API auth |
| `PAPERTAPE_RUN_ID` | Current heartbeat run ID |
| `PAPERTAPE_TASK_ID` | Issue that triggered this wake |
| `PAPERTAPE_WAKE_REASON` | Wake trigger reason |
| `PAPERTAPE_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `PAPERTAPE_APPROVAL_ID` | Resolved approval ID |
| `PAPERTAPE_APPROVAL_STATUS` | Approval decision |
| `PAPERTAPE_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
