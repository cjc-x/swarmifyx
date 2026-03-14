---
title: 控制平面命令
summary: Issue、agent、approval 和 dashboard 命令
---

用于管理 issues、agents、approvals 等对象的客户端命令。

## Issue 命令

```sh
# 列出 issues
pnpm swarmifyx issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# 查看 issue 详情
pnpm swarmifyx issue get <issue-id-or-identifier>

# 创建 issue
pnpm swarmifyx issue create --title "..." [--description "..."] [--status todo] [--priority high]

# 更新 issue
pnpm swarmifyx issue update <issue-id> [--status in_progress] [--comment "..."]

# 添加评论
pnpm swarmifyx issue comment <issue-id> --body "..." [--reopen]

# checkout 任务
pnpm swarmifyx issue checkout <issue-id> --agent-id <agent-id>

# 释放任务
pnpm swarmifyx issue release <issue-id>
```

## Company 命令

```sh
pnpm swarmifyx company list
pnpm swarmifyx company get <company-id>

# 导出为便携目录包（会写入 manifest 和 markdown 文件）
pnpm swarmifyx company export <company-id> --out ./exports/acme --include company,agents

# 预览导入（不写入）
pnpm swarmifyx company import \
  --from https://github.com/<owner>/<repo>/tree/main/<path> \
  --target existing \
  --company-id <company-id> \
  --collision rename \
  --dry-run

# 正式执行导入
pnpm swarmifyx company import \
  --from ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent 命令

```sh
pnpm swarmifyx agent list
pnpm swarmifyx agent get <agent-id>
```

## Approval 命令

```sh
# 列出 approvals
pnpm swarmifyx approval list [--status pending]

# 查看 approval
pnpm swarmifyx approval get <approval-id>

# 创建 approval
pnpm swarmifyx approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# 批准
pnpm swarmifyx approval approve <approval-id> [--decision-note "..."]

# 拒绝
pnpm swarmifyx approval reject <approval-id> [--decision-note "..."]

# 请求修订
pnpm swarmifyx approval request-revision <approval-id> [--decision-note "..."]

# 重新提交
pnpm swarmifyx approval resubmit <approval-id> [--payload '{"..."}']

# 评论
pnpm swarmifyx approval comment <approval-id> --body "..."
```

## Activity 命令

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
