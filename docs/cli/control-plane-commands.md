---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm swarmifyx issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm swarmifyx issue get <issue-id-or-identifier>

# Create issue
pnpm swarmifyx issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm swarmifyx issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm swarmifyx issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm swarmifyx issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm swarmifyx issue release <issue-id>
```

## Company Commands

```sh
pnpm swarmifyx company list
pnpm swarmifyx company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm swarmifyx company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm swarmifyx company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm swarmifyx company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm swarmifyx agent list
pnpm swarmifyx agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm swarmifyx approval list [--status pending]

# Get approval
pnpm swarmifyx approval get <approval-id>

# Create approval
pnpm swarmifyx approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm swarmifyx approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm swarmifyx approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm swarmifyx approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm swarmifyx approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm swarmifyx approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm swarmifyx activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm swarmifyx dashboard get
```

## Heartbeat

```sh
pnpm swarmifyx heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
