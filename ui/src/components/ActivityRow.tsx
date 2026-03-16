import { Link } from "@/lib/router";
import { Identity } from "./Identity";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { useI18n } from "../context/I18nContext";
import { getPriorityLabel, getStatusLabel } from "../lib/i18n";
import { deriveProjectUrlKey, type ActivityEvent, type Agent } from "@papertape/shared";

const ACTION_VERBS: Record<string, string> = {
  "agent_api_key.claimed": "claimed API key",
  "issue.created": "created",
  "issue.updated": "updated",
  "issue.approval_linked": "linked approval to",
  "issue.approval_unlinked": "unlinked approval from",
  "issue.checked_out": "checked out",
  "issue.checkout_lock_adopted": "adopted checkout lock for",
  "issue.released": "released",
  "issue.comment_added": "commented on",
  "issue.attachment_added": "attached file to",
  "issue.attachment_removed": "removed attachment from",
  "issue.document_created": "created document for",
  "issue.document_updated": "updated document on",
  "issue.document_deleted": "deleted document from",
  "issue.commented": "commented on",
  "issue.read_marked": "marked as read",
  "issue.deleted": "deleted",
  "asset.created": "created",
  "agent.created": "created",
  "agent.deleted": "deleted",
  "agent.hire_created": "started hire for",
  "agent.config_rolled_back": "rolled back configuration for",
  "agent.instructions_path_updated": "updated instructions path for",
  "agent.permissions_updated": "updated permissions for",
  "agent.updated": "updated",
  "agent.updated_from_join_replay": "synced join replay for",
  "agent.paused": "paused",
  "agent.resumed": "resumed",
  "agent.terminated": "terminated",
  "agent.key_created": "created API key for",
  "agent.budget_updated": "updated budget for",
  "agent.runtime_session_reset": "reset session for",
  "heartbeat.invoked": "invoked heartbeat for",
  "heartbeat.cancelled": "cancelled heartbeat for",
  "approval.created": "requested approval",
  "approval.comment_added": "commented on",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  "approval.requester_wakeup_failed": "failed to wake requester for",
  "approval.requester_wakeup_queued": "queued requester wakeup for",
  "approval.resubmitted": "resubmitted",
  "approval.revision_requested": "requested revision for",
  "join.approved": "approved join request for",
  "join.rejected": "rejected join request for",
  "project.created": "created",
  "project.updated": "updated",
  "project.deleted": "deleted",
  "project.workspace_created": "created workspace for",
  "project.workspace_deleted": "deleted workspace for",
  "project.workspace_updated": "updated workspace for",
  "goal.created": "created",
  "goal.updated": "updated",
  "goal.deleted": "deleted",
  "cost.reported": "reported cost for",
  "cost.recorded": "recorded cost for",
  "label.created": "created label",
  "label.deleted": "deleted label",
  "secret.created": "created secret",
  "secret.deleted": "deleted secret",
  "secret.rotated": "rotated secret",
  "secret.updated": "updated secret",
  "invite.created": "created invite",
  "invite.openclaw_prompt_created": "generated OpenClaw invite prompt",
  "invite.revoked": "revoked invite",
  "hire_hook.error": "hire hook errored for",
  "hire_hook.failed": "hire hook failed for",
  "hire_hook.succeeded": "hire hook succeeded for",
  "company.created": "created company",
  "company.imported": "imported",
  "company.updated": "updated company",
  "company.archived": "archived",
  "company.budget_updated": "updated budget for",
  create: "created",
  created: "created",
  update: "updated",
  updated: "updated",
  skip: "skipped",
  skipped: "skipped",
};

function formatVerb(
  action: string,
  details: Record<string, unknown> | null | undefined,
  t: (text: string, values?: Record<string, string | number>) => string,
): string {
  if (action === "issue.updated" && details) {
    const previous = (details._previous ?? {}) as Record<string, unknown>;
    if (details.status !== undefined) {
      const from = previous.status;
      return from
        ? t("changed status from {from} to {to} on", {
          from: getStatusLabel(String(from)),
          to: getStatusLabel(String(details.status)),
        })
        : t("changed status to {to} on", { to: getStatusLabel(String(details.status)) });
    }
    if (details.priority !== undefined) {
      const from = previous.priority;
      return from
        ? t("changed priority from {from} to {to} on", {
          from: getPriorityLabel(String(from)),
          to: getPriorityLabel(String(details.priority)),
        })
        : t("changed priority to {to} on", { to: getPriorityLabel(String(details.priority)) });
    }
  }
  return t(ACTION_VERBS[action] ?? action.replace(/[._]/g, " "));
}

function entityLink(entityType: string, entityId: string, name?: string | null): string | null {
  switch (entityType) {
    case "issue": return `/issues/${name ?? entityId}`;
    case "agent": return `/agents/${entityId}`;
    case "project": return `/projects/${deriveProjectUrlKey(name, entityId)}`;
    case "goal": return `/goals/${entityId}`;
    case "approval": return `/approvals/${entityId}`;
    default: return null;
  }
}

interface ActivityRowProps {
  event: ActivityEvent;
  agentMap: Map<string, Agent>;
  entityNameMap: Map<string, string>;
  entityTitleMap?: Map<string, string>;
  className?: string;
}

export function ActivityRow({ event, agentMap, entityNameMap, entityTitleMap, className }: ActivityRowProps) {
  const { t } = useI18n();
  const verb = formatVerb(event.action, event.details, t);

  const isHeartbeatEvent = event.entityType === "heartbeat_run";
  const heartbeatAgentId = isHeartbeatEvent
    ? (event.details as Record<string, unknown> | null)?.agentId as string | undefined
    : undefined;

  const name = isHeartbeatEvent
    ? (heartbeatAgentId ? entityNameMap.get(`agent:${heartbeatAgentId}`) : null)
    : entityNameMap.get(`${event.entityType}:${event.entityId}`);

  const entityTitle = entityTitleMap?.get(`${event.entityType}:${event.entityId}`);

  const link = isHeartbeatEvent && heartbeatAgentId
    ? `/agents/${heartbeatAgentId}/runs/${event.entityId}`
    : entityLink(event.entityType, event.entityId, name);

  const actor = event.actorType === "agent" ? agentMap.get(event.actorId) : null;
  const actorName = actor?.name ?? (event.actorType === "system" ? t("System") : event.actorType === "user" ? t("Board") : event.actorId || t("Unknown"));

  const inner = (
    <div className="flex gap-3">
      <p className="flex-1 min-w-0 truncate">
        <Identity
          name={actorName}
          size="xs"
          className="align-baseline"
        />
        <span className="text-muted-foreground ml-1">{verb} </span>
        {name && <span className="font-medium">{name}</span>}
        {entityTitle && <span className="text-muted-foreground ml-1">— {entityTitle}</span>}
      </p>
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{timeAgo(event.createdAt)}</span>
    </div>
  );

  const classes = cn(
    "px-4 py-2 text-sm",
    link && "cursor-pointer hover:bg-accent/50 transition-colors",
    className,
  );

  if (link) {
    return (
      <Link to={link} className={cn(classes, "no-underline text-inherit block")}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {inner}
    </div>
  );
}
