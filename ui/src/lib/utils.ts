import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { deriveAgentUrlKey, deriveProjectUrlKey } from "@papertape/shared";
import {
  formatCurrency,
  formatDateTimeValue,
  formatDateValue,
  formatRelativeTimeValue,
  formatTimeValue,
} from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCents(cents: number): string {
  return formatCurrency(cents);
}

export function formatDate(date: Date | string): string {
  return formatDateValue(date);
}

export function formatDateTime(date: Date | string): string {
  return formatDateTimeValue(date);
}

function hasExplicitTimePart(options: Intl.DateTimeFormatOptions): boolean {
  return (
    options.timeStyle !== undefined ||
    options.hour !== undefined ||
    options.minute !== undefined ||
    options.second !== undefined ||
    options.fractionalSecondDigits !== undefined ||
    options.dayPeriod !== undefined
  );
}

export function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  if (!options) return formatTimeValue(date);
  if (options.dateStyle !== undefined || hasExplicitTimePart(options)) {
    return formatTimeValue(date, undefined, options);
  }
  return formatTimeValue(date, undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
}

export function relativeTime(date: Date | string): string {
  return formatRelativeTimeValue(date);
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Build an issue URL using the human-readable identifier when available. */
export function issueUrl(issue: { id: string; identifier?: string | null }): string {
  return `/issues/${issue.identifier ?? issue.id}`;
}

/** Build an agent route URL using the short URL key when available. */
export function agentRouteRef(agent: { id: string; urlKey?: string | null; name?: string | null }): string {
  return agent.urlKey ?? deriveAgentUrlKey(agent.name, agent.id);
}

/** Build an agent URL using the short URL key when available. */
export function agentUrl(agent: { id: string; urlKey?: string | null; name?: string | null }): string {
  return `/agents/${agentRouteRef(agent)}`;
}

/** Build a project route reference using the short URL key when available. */
export function projectRouteRef(project: { id: string; urlKey?: string | null; name?: string | null }): string {
  return project.urlKey ?? deriveProjectUrlKey(project.name, project.id);
}

/** Build a project URL using the short URL key when available. */
export function projectUrl(project: { id: string; urlKey?: string | null; name?: string | null }): string {
  return `/projects/${projectRouteRef(project)}`;
}
