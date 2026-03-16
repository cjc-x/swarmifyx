---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm papertape issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm papertape issue get <issue-id-or-identifier>

# Create issue
pnpm papertape issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm papertape issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm papertape issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm papertape issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm papertape issue release <issue-id>
```

## Company Commands

```sh
pnpm papertape company list
pnpm papertape company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm papertape company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm papertape company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# Apply import
pnpm papertape company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm papertape agent list
pnpm papertape agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm papertape approval list [--status pending]

# Get approval
pnpm papertape approval get <approval-id>

# Create approval
pnpm papertape approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm papertape approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm papertape approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm papertape approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm papertape approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm papertape approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm papertape activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm papertape dashboard get
```

## Heartbeat

```sh
pnpm papertape heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
