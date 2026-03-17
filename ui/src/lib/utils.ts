import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { deriveAgentUrlKey, deriveProjectUrlKey, type BillingType, type FinanceDirection, type FinanceEventKind } from "@chopsticks/shared";
import {
  formatCurrency,
  formatDateTimeValue,
  formatDateValue,
  formatRelativeTimeValue,
  formatTimeValue,
  translateText,
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

/** Map a raw provider slug to a display-friendly name. */
export function providerDisplayName(provider: string): string {
  const map: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    openrouter: "OpenRouter",
    chatgpt: "ChatGPT",
    google: "Google",
    cursor: "Cursor",
    jetbrains: "JetBrains AI",
  };
  return map[provider.toLowerCase()] ?? provider;
}

export function billingTypeDisplayName(billingType: BillingType): string {
  const map: Record<BillingType, string> = {
    metered_api: translateText("Metered API"),
    subscription_included: translateText("Subscription"),
    subscription_overage: translateText("Subscription overage"),
    credits: translateText("Credits"),
    fixed: translateText("Fixed"),
    unknown: translateText("Unknown"),
  };
  return map[billingType];
}

export function quotaSourceDisplayName(source: string): string {
  const map: Record<string, string> = {
    "anthropic-oauth": translateText("Anthropic OAuth"),
    "claude-cli": translateText("Claude CLI"),
    "codex-rpc": translateText("Codex app server"),
    "codex-wham": translateText("ChatGPT WHAM"),
  };
  return map[source] ?? source;
}

function coerceBillingType(value: unknown): BillingType | null {
  if (
    value === "metered_api" ||
    value === "subscription_included" ||
    value === "subscription_overage" ||
    value === "credits" ||
    value === "fixed" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
}

function readRunCostUsd(payload: Record<string, unknown> | null): number {
  if (!payload) return 0;
  for (const key of ["costUsd", "cost_usd", "total_cost_usd"] as const) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

export function visibleRunCostUsd(
  usage: Record<string, unknown> | null,
  result: Record<string, unknown> | null = null,
): number {
  const billingType = coerceBillingType(usage?.billingType) ?? coerceBillingType(result?.billingType);
  if (billingType === "subscription_included") return 0;
  return readRunCostUsd(usage) || readRunCostUsd(result);
}

export function financeEventKindDisplayName(eventKind: FinanceEventKind): string {
  const map: Record<FinanceEventKind, string> = {
    inference_charge: translateText("Inference charge"),
    platform_fee: translateText("Platform fee"),
    credit_purchase: translateText("Credit purchase"),
    credit_refund: translateText("Credit refund"),
    credit_expiry: translateText("Credit expiry"),
    byok_fee: translateText("BYOK fee"),
    gateway_overhead: translateText("Gateway overhead"),
    log_storage_charge: translateText("Log storage"),
    logpush_charge: translateText("Logpush"),
    provisioned_capacity_charge: translateText("Provisioned capacity"),
    training_charge: translateText("Training"),
    custom_model_import_charge: translateText("Custom model import"),
    custom_model_storage_charge: translateText("Custom model storage"),
    manual_adjustment: translateText("Manual adjustment"),
  };
  return map[eventKind];
}

export function financeDirectionDisplayName(direction: FinanceDirection): string {
  return direction === "credit" ? translateText("Credit") : translateText("Debit");
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
