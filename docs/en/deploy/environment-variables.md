---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Swarmifyx uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `SWARMIFYX_HOME` | `~/.swarmifyx` | Base directory for all Swarmifyx data |
| `SWARMIFYX_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `SWARMIFYX_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `SWARMIFYX_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `SWARMIFYX_SECRETS_MASTER_KEY_FILE` | `~/.swarmifyx/.../secrets/master.key` | Path to key file |
| `SWARMIFYX_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `SWARMIFYX_AGENT_ID` | Agent's unique ID |
| `SWARMIFYX_COMPANY_ID` | Company ID |
| `SWARMIFYX_API_URL` | Swarmifyx API base URL |
| `SWARMIFYX_API_KEY` | Short-lived JWT for API auth |
| `SWARMIFYX_RUN_ID` | Current heartbeat run ID |
| `SWARMIFYX_TASK_ID` | Issue that triggered this wake |
| `SWARMIFYX_WAKE_REASON` | Wake trigger reason |
| `SWARMIFYX_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `SWARMIFYX_APPROVAL_ID` | Resolved approval ID |
| `SWARMIFYX_APPROVAL_STATUS` | Approval decision |
| `SWARMIFYX_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
