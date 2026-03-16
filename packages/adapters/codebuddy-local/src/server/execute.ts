import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@papertape/adapter-utils";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  buildPapertapeEnv,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  parseObject,
  redactEnvForLogs,
  renderTemplate,
  runChildProcess,
} from "@papertape/adapter-utils/server-utils";
import {
  DEFAULT_CODEBUDDY_LOCAL_MODEL,
  DEFAULT_CODEBUDDY_LOCAL_SKIP_PERMISSIONS,
} from "../index.js";
import { hasCodeBuddyPermissionsBypassArg } from "../shared/permissions.js";
import { normalizeCodeBuddyStreamLine } from "../shared/stream.js";
import { isCodeBuddyUnknownSessionError, parseCodeBuddyJsonl } from "./parse.js";

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));
const PAPERTAPE_SKILLS_CANDIDATES = [
  path.resolve(__moduleDir, "../../skills"),
  path.resolve(__moduleDir, "../../../../../skills"),
];

function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function codeBuddyHomeDir(): string {
  const configured = process.env.CODEBUDDY_HOME;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim();
  }
  return path.join(os.homedir(), ".codebuddy");
}

function codeBuddySkillsHome(): string {
  return path.join(codeBuddyHomeDir(), "skills");
}

function resolveProviderFromModel(model: string): string | null {
  const trimmed = model.trim().toLowerCase();
  if (!trimmed) return null;
  const slash = trimmed.indexOf("/");
  if (slash > 0) return trimmed.slice(0, slash);
  if (trimmed.startsWith("glm")) return "zhipu";
  if (trimmed.startsWith("minimax")) return "minimax";
  if (trimmed.startsWith("kimi")) return "moonshot";
  if (trimmed.startsWith("deepseek")) return "deepseek";
  if (trimmed.startsWith("hunyuan")) return "tencent";
  return null;
}

function normalizeEffort(rawEffort: string): "low" | "medium" | "high" | "xhigh" | null {
  const effort = rawEffort.trim().toLowerCase();
  if (effort === "low" || effort === "medium" || effort === "high" || effort === "xhigh") {
    return effort;
  }
  return null;
}

function renderPapertapeEnvNote(env: Record<string, string>): string {
  const papertapeKeys = Object.keys(env)
    .filter((key) => key.startsWith("PAPERTAPE_"))
    .sort();
  if (papertapeKeys.length === 0) return "";
  return [
    "Papertape runtime note:",
    `The following PAPERTAPE_* environment variables are available in this run: ${papertapeKeys.join(", ")}`,
    "Do not assume these variables are missing without checking your shell environment.",
    "",
    "",
  ].join("\n");
}

async function resolvePapertapeSkillsDir(): Promise<string | null> {
  for (const candidate of PAPERTAPE_SKILLS_CANDIDATES) {
    const isDir = await fs.stat(candidate).then((s) => s.isDirectory()).catch(() => false);
    if (isDir) return candidate;
  }
  return null;
}

type EnsureCodeBuddySkillsInjectedOptions = {
  skillsDir?: string | null;
  skillsHome?: string;
  linkSkill?: (source: string, target: string) => Promise<void>;
};

export async function ensureCodeBuddySkillsInjected(
  onLog: AdapterExecutionContext["onLog"],
  options: EnsureCodeBuddySkillsInjectedOptions = {},
) {
  const skillsDir = options.skillsDir ?? await resolvePapertapeSkillsDir();
  if (!skillsDir) return;

  const skillsHome = options.skillsHome ?? codeBuddySkillsHome();
  try {
    await fs.mkdir(skillsHome, { recursive: true });
  } catch (err) {
    await onLog(
      "stderr",
      `[papertape] Failed to prepare CodeBuddy skills directory ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return;
  }

  let entries: Dirent[];
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch (err) {
    await onLog(
      "stderr",
      `[papertape] Failed to read Papertape skills from ${skillsDir}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return;
  }

  const linkSkill = options.linkSkill ?? ((source: string, target: string) =>
    fs.symlink(source, target, process.platform === "win32" ? "junction" : "dir"));
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const source = path.join(skillsDir, entry.name);
    const target = path.join(skillsHome, entry.name);
    const existing = await fs.lstat(target).catch(() => null);
    if (existing) continue;

    try {
      await linkSkill(source, target);
      await onLog(
        "stderr",
        `[papertape] Injected CodeBuddy skill "${entry.name}" into ${skillsHome}\n`,
      );
    } catch (err) {
      await onLog(
        "stderr",
        `[papertape] Failed to inject CodeBuddy skill "${entry.name}" into ${skillsHome}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { runId, agent, runtime, config, context, onLog, onMeta, authToken } = ctx;

  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Papertape work.",
  );
  const command = asString(config.command, "codebuddy");
  const model = asString(config.model, DEFAULT_CODEBUDDY_LOCAL_MODEL).trim();
  const effort = normalizeEffort(asString(config.effort, ""));
  const maxTurnsPerRun = Math.max(0, asNumber(config.maxTurnsPerRun, 0));
  const allowSkipPermissions = asBoolean(
    config.dangerouslySkipPermissions,
    DEFAULT_CODEBUDDY_LOCAL_SKIP_PERMISSIONS,
  );

  const workspaceContext = parseObject(context.papertapeWorkspace);
  const workspaceCwd = asString(workspaceContext.cwd, "");
  const workspaceSource = asString(workspaceContext.source, "");
  const workspaceId = asString(workspaceContext.workspaceId, "");
  const workspaceRepoUrl = asString(workspaceContext.repoUrl, "");
  const workspaceRepoRef = asString(workspaceContext.repoRef, "");
  const workspaceHints = Array.isArray(context.papertapeWorkspaces)
    ? context.papertapeWorkspaces.filter(
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null,
    )
    : [];
  const configuredCwd = asString(config.cwd, "");
  const useConfiguredInsteadOfAgentHome = workspaceSource === "agent_home" && configuredCwd.length > 0;
  const effectiveWorkspaceCwd = useConfiguredInsteadOfAgentHome ? "" : workspaceCwd;
  const cwd = effectiveWorkspaceCwd || configuredCwd || process.cwd();
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });
  await ensureCodeBuddySkillsInjected(onLog);

  const envConfig = parseObject(config.env);
  const hasExplicitApiKey =
    typeof envConfig.PAPERTAPE_API_KEY === "string" && envConfig.PAPERTAPE_API_KEY.trim().length > 0;
  const env: Record<string, string> = { ...buildPapertapeEnv(agent) };
  env.PAPERTAPE_RUN_ID = runId;
  const wakeTaskId =
    (typeof context.taskId === "string" && context.taskId.trim().length > 0 && context.taskId.trim()) ||
    (typeof context.issueId === "string" && context.issueId.trim().length > 0 && context.issueId.trim()) ||
    null;
  const wakeReason =
    typeof context.wakeReason === "string" && context.wakeReason.trim().length > 0
      ? context.wakeReason.trim()
      : null;
  const wakeCommentId =
    (typeof context.wakeCommentId === "string" && context.wakeCommentId.trim().length > 0 && context.wakeCommentId.trim()) ||
    (typeof context.commentId === "string" && context.commentId.trim().length > 0 && context.commentId.trim()) ||
    null;
  const approvalId =
    typeof context.approvalId === "string" && context.approvalId.trim().length > 0
      ? context.approvalId.trim()
      : null;
  const approvalStatus =
    typeof context.approvalStatus === "string" && context.approvalStatus.trim().length > 0
      ? context.approvalStatus.trim()
      : null;
  const linkedIssueIds = Array.isArray(context.issueIds)
    ? context.issueIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  if (wakeTaskId) env.PAPERTAPE_TASK_ID = wakeTaskId;
  if (wakeReason) env.PAPERTAPE_WAKE_REASON = wakeReason;
  if (wakeCommentId) env.PAPERTAPE_WAKE_COMMENT_ID = wakeCommentId;
  if (approvalId) env.PAPERTAPE_APPROVAL_ID = approvalId;
  if (approvalStatus) env.PAPERTAPE_APPROVAL_STATUS = approvalStatus;
  if (linkedIssueIds.length > 0) env.PAPERTAPE_LINKED_ISSUE_IDS = linkedIssueIds.join(",");
  if (effectiveWorkspaceCwd) env.PAPERTAPE_WORKSPACE_CWD = effectiveWorkspaceCwd;
  if (workspaceSource) env.PAPERTAPE_WORKSPACE_SOURCE = workspaceSource;
  if (workspaceId) env.PAPERTAPE_WORKSPACE_ID = workspaceId;
  if (workspaceRepoUrl) env.PAPERTAPE_WORKSPACE_REPO_URL = workspaceRepoUrl;
  if (workspaceRepoRef) env.PAPERTAPE_WORKSPACE_REPO_REF = workspaceRepoRef;
  if (workspaceHints.length > 0) env.PAPERTAPE_WORKSPACES_JSON = JSON.stringify(workspaceHints);
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  if (!hasExplicitApiKey && authToken) {
    env.PAPERTAPE_API_KEY = authToken;
  }

  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });
  await ensureCommandResolvable(command, cwd, runtimeEnv);

  const timeoutSec = asNumber(config.timeoutSec, 0);
  const graceSec = asNumber(config.graceSec, 15);
  const extraArgs = (() => {
    const fromExtraArgs = asStringArray(config.extraArgs);
    if (fromExtraArgs.length > 0) return fromExtraArgs;
    return asStringArray(config.args);
  })();
  const autoPermissionsEnabled = allowSkipPermissions && !hasCodeBuddyPermissionsBypassArg(extraArgs);

  const runtimeSessionParams = parseObject(runtime.sessionParams);
  const runtimeSessionId = asString(runtimeSessionParams.sessionId, runtime.sessionId ?? "");
  const runtimeSessionCwd = asString(runtimeSessionParams.cwd, "");
  const canResumeSession =
    runtimeSessionId.length > 0 &&
    (runtimeSessionCwd.length === 0 || path.resolve(runtimeSessionCwd) === path.resolve(cwd));
  const sessionId = canResumeSession ? runtimeSessionId : null;
  if (runtimeSessionId && !canResumeSession) {
    await onLog(
      "stderr",
      `[papertape] CodeBuddy session "${runtimeSessionId}" was saved for cwd "${runtimeSessionCwd}" and will not be resumed in "${cwd}".\n`,
    );
  }

  const instructionsFilePath = asString(config.instructionsFilePath, "").trim();
  const instructionsDir = instructionsFilePath ? `${path.dirname(instructionsFilePath)}/` : "";
  let instructionsPrefix = "";
  if (instructionsFilePath) {
    try {
      const instructionsContents = await fs.readFile(instructionsFilePath, "utf8");
      instructionsPrefix =
        `${instructionsContents}\n\n` +
        `The above agent instructions were loaded from ${instructionsFilePath}. ` +
        `Resolve any relative file references from ${instructionsDir}.\n\n`;
      await onLog(
        "stderr",
        `[papertape] Loaded agent instructions file: ${instructionsFilePath}\n`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await onLog(
        "stderr",
        `[papertape] Warning: could not read agent instructions file "${instructionsFilePath}": ${reason}\n`,
      );
    }
  }

  const commandNotes = (() => {
    const notes: string[] = [];
    if (autoPermissionsEnabled) {
      notes.push("Auto-added -y to bypass interactive permission prompts.");
    }
    if (effort) {
      notes.push(`Configured CodeBuddy effort=${effort}.`);
    }
    if (maxTurnsPerRun > 0) {
      notes.push(`Configured --max-turns ${maxTurnsPerRun}.`);
    }
    notes.push("Prompt is piped to CodeBuddy via stdin.");
    if (!instructionsFilePath) return notes;
    if (instructionsPrefix.length > 0) {
      notes.push(
        `Loaded agent instructions from ${instructionsFilePath}`,
        `Prepended instructions + path directive to prompt (relative references from ${instructionsDir}).`,
      );
      return notes;
    }
    notes.push(
      `Configured instructionsFilePath ${instructionsFilePath}, but file could not be read; continuing without injected instructions.`,
    );
    return notes;
  })();

  const renderedPrompt = renderTemplate(promptTemplate, {
    agentId: agent.id,
    companyId: agent.companyId,
    runId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId, source: "on_demand" },
    context,
  });
  const papertapeEnvNote = renderPapertapeEnvNote(env);
  const prompt = `${instructionsPrefix}${papertapeEnvNote}${renderedPrompt}`;

  const buildArgs = (resumeSessionId: string | null) => {
    const args = ["-p", "--output-format", "stream-json"];
    if (resumeSessionId) args.push("--resume", resumeSessionId);
    if (model) args.push("--model", model);
    if (effort) args.push("--effort", effort);
    if (maxTurnsPerRun > 0) args.push("--max-turns", String(maxTurnsPerRun));
    if (autoPermissionsEnabled) args.push("-y");
    if (extraArgs.length > 0) args.push(...extraArgs);
    return args;
  };

  const runAttempt = async (resumeSessionId: string | null) => {
    const args = buildArgs(resumeSessionId);
    if (onMeta) {
      await onMeta({
        adapterType: "codebuddy_local",
        command,
        cwd,
        commandArgs: args,
        commandNotes,
        env: redactEnvForLogs(env),
        prompt,
        context,
      });
    }

    let stdoutLineBuffer = "";
    const emitNormalizedStdoutLine = async (rawLine: string) => {
      const normalized = normalizeCodeBuddyStreamLine(rawLine);
      if (!normalized.line) return;
      await onLog(normalized.stream ?? "stdout", `${normalized.line}\n`);
    };
    const flushStdoutChunk = async (chunk: string, finalize = false) => {
      const combined = `${stdoutLineBuffer}${chunk}`;
      const lines = combined.split(/\r?\n/);
      stdoutLineBuffer = lines.pop() ?? "";

      for (const line of lines) {
        await emitNormalizedStdoutLine(line);
      }

      if (finalize) {
        const trailing = stdoutLineBuffer.trim();
        stdoutLineBuffer = "";
        if (trailing) {
          await emitNormalizedStdoutLine(trailing);
        }
      }
    };

    const proc = await runChildProcess(runId, command, args, {
      cwd,
      env,
      timeoutSec,
      graceSec,
      stdin: prompt,
      onLog: async (stream, chunk) => {
        if (stream !== "stdout") {
          await onLog(stream, chunk);
          return;
        }
        await flushStdoutChunk(chunk);
      },
    });
    await flushStdoutChunk("", true);

    return {
      proc,
      parsed: parseCodeBuddyJsonl(proc.stdout),
    };
  };

  const providerFromModel = resolveProviderFromModel(model);

  const toResult = (
    attempt: {
      proc: {
        exitCode: number | null;
        signal: string | null;
        timedOut: boolean;
        stdout: string;
        stderr: string;
      };
      parsed: ReturnType<typeof parseCodeBuddyJsonl>;
    },
    clearSessionOnMissingSession = false,
  ): AdapterExecutionResult => {
    if (attempt.proc.timedOut) {
      return {
        exitCode: attempt.proc.exitCode,
        signal: attempt.proc.signal,
        timedOut: true,
        errorMessage: `Timed out after ${timeoutSec}s`,
        clearSession: clearSessionOnMissingSession,
      };
    }

    const resolvedSessionId = attempt.parsed.sessionId ?? runtimeSessionId ?? runtime.sessionId ?? null;
    const resolvedSessionParams = resolvedSessionId
      ? ({
        sessionId: resolvedSessionId,
        cwd,
        ...(workspaceId ? { workspaceId } : {}),
        ...(workspaceRepoUrl ? { repoUrl: workspaceRepoUrl } : {}),
        ...(workspaceRepoRef ? { repoRef: workspaceRepoRef } : {}),
      } as Record<string, unknown>)
      : null;
    const parsedError = typeof attempt.parsed.errorMessage === "string" ? attempt.parsed.errorMessage.trim() : "";
    const stderrLine = firstNonEmptyLine(attempt.proc.stderr);
    const errorMessage =
      parsedError ||
      ((attempt.proc.exitCode ?? 0) !== 0
        ? stderrLine || `CodeBuddy exited with code ${attempt.proc.exitCode ?? -1}`
        : null);

    return {
      exitCode: attempt.proc.exitCode,
      signal: attempt.proc.signal,
      timedOut: false,
      errorMessage,
      usage: attempt.parsed.usage,
      sessionId: resolvedSessionId,
      sessionParams: resolvedSessionParams,
      sessionDisplayId: resolvedSessionId,
      provider: providerFromModel,
      model: model || null,
      billingType: "unknown",
      costUsd: attempt.parsed.costUsd,
      resultJson: {
        stdout: attempt.proc.stdout,
        stderr: attempt.proc.stderr,
      },
      summary: attempt.parsed.summary,
      clearSession: Boolean(clearSessionOnMissingSession && !resolvedSessionId),
    };
  };

  const initial = await runAttempt(sessionId);
  if (
    sessionId &&
    !initial.proc.timedOut &&
    isCodeBuddyUnknownSessionError(initial.proc.stdout, initial.proc.stderr)
  ) {
    await onLog(
      "stderr",
      `[papertape] CodeBuddy resume session "${sessionId}" is unavailable; retrying with a fresh session.\n`,
    );
    const retry = await runAttempt(null);
    return toResult(retry, true);
  }

  return toResult(initial);
}
