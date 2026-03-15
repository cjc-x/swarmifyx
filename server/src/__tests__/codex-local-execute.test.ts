import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { execute } from "@swarmifyx/adapter-codex-local/server";

async function writeFakeCodexCommand(root: string, baseName: string): Promise<string> {
  const scriptPath = path.join(root, `${baseName}.cjs`);
  const commandPath = process.platform === "win32"
    ? path.join(root, `${baseName}.cmd`)
    : path.join(root, baseName);

  const script = `#!/usr/bin/env node
const fs = require("node:fs");

const capturePath = process.env.SWARMIFYX_TEST_CAPTURE_PATH;
const payload = {
  argv: process.argv.slice(2),
  prompt: fs.readFileSync(0, "utf8"),
  codexHome: process.env.CODEX_HOME || null,
  swarmifyxEnvKeys: Object.keys(process.env)
    .filter((key) => key.startsWith("SWARMIFYX_"))
    .sort(),
};
if (capturePath) {
  fs.writeFileSync(capturePath, JSON.stringify(payload), "utf8");
}
console.log(JSON.stringify({ type: "thread.started", thread_id: "codex-session-1" }));
console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "hello" } }));
console.log(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1, cached_input_tokens: 0, output_tokens: 1 } }));
`;
  await fs.writeFile(scriptPath, script, "utf8");

  const launcher = process.platform === "win32"
    ? `@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`
    : `#!/bin/sh\n"${process.execPath}" "${scriptPath}" "$@"\n`;
  await fs.writeFile(commandPath, launcher, "utf8");
  await fs.chmod(commandPath, 0o755);

  return commandPath;
}

type CapturePayload = {
  argv: string[];
  prompt: string;
  codexHome: string | null;
  swarmifyxEnvKeys: string[];
};

describe("codex execute", () => {
  it("preserves the configured CODEX_HOME while injecting shared auth, config, and skills", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "swarmifyx-codex-execute-"));
    const workspace = path.join(root, "workspace");
    const capturePath = path.join(root, "capture.json");
    const sharedCodexHome = path.join(root, "shared-codex-home");
    const swarmifyxHome = path.join(root, "swarmifyx-home");
    await fs.mkdir(workspace, { recursive: true });
    await fs.mkdir(sharedCodexHome, { recursive: true });
    await fs.writeFile(path.join(sharedCodexHome, "auth.json"), '{"token":"shared"}\n', "utf8");
    await fs.writeFile(path.join(sharedCodexHome, "config.toml"), 'model = "codex-mini-latest"\n', "utf8");
    const commandPath = await writeFakeCodexCommand(root, "codex");

    const previousHome = process.env.HOME;
    const previousSwamifyxHome = process.env.SWARMIFYX_HOME;
    const previousSwamifyxInstanceId = process.env.SWARMIFYX_INSTANCE_ID;
    const previousSwamifyxInWorktree = process.env.SWARMIFYX_IN_WORKTREE;
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.HOME = root;
    process.env.SWARMIFYX_HOME = swarmifyxHome;
    process.env.SWARMIFYX_INSTANCE_ID = "worktree-1";
    process.env.SWARMIFYX_IN_WORKTREE = "true";
    process.env.CODEX_HOME = sharedCodexHome;

    try {
      const result = await execute({
        runId: "run-1",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Codex Coder",
          adapterType: "codex_local",
          adapterConfig: {},
        },
        runtime: {
          sessionId: null,
          sessionParams: null,
          sessionDisplayId: null,
          taskKey: null,
        },
        config: {
          command: commandPath,
          cwd: workspace,
          env: {
            SWARMIFYX_TEST_CAPTURE_PATH: capturePath,
          },
          promptTemplate: "Follow the swarmifyx heartbeat.",
        },
        context: {},
        authToken: "run-jwt-token",
        onLog: async () => { },
      });

      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toBeNull();

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.codexHome).toBe(sharedCodexHome);
      expect(capture.argv).toEqual(expect.arrayContaining(["exec", "--json", "-"]));
      expect(capture.prompt).toContain("Follow the swarmifyx heartbeat.");
      expect(capture.swarmifyxEnvKeys).toEqual(
        expect.arrayContaining([
          "SWARMIFYX_AGENT_ID",
          "SWARMIFYX_API_KEY",
          "SWARMIFYX_API_URL",
          "SWARMIFYX_COMPANY_ID",
          "SWARMIFYX_RUN_ID",
        ]),
      );

      const sharedAuth = path.join(sharedCodexHome, "auth.json");
      const sharedConfig = path.join(sharedCodexHome, "config.toml");
      const sharedSkill = path.join(sharedCodexHome, "skills", "swarmifyx");

      expect((await fs.lstat(sharedAuth)).isFile()).toBe(true);
      expect(await fs.readFile(sharedConfig, "utf8")).toBe('model = "codex-mini-latest"\n');
      expect((await fs.lstat(sharedSkill)).isSymbolicLink()).toBe(true);
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
      if (previousSwamifyxHome === undefined) delete process.env.SWARMIFYX_HOME;
      else process.env.SWARMIFYX_HOME = previousSwamifyxHome;
      if (previousSwamifyxInstanceId === undefined) delete process.env.SWARMIFYX_INSTANCE_ID;
      else process.env.SWARMIFYX_INSTANCE_ID = previousSwamifyxInstanceId;
      if (previousSwamifyxInWorktree === undefined) delete process.env.SWARMIFYX_IN_WORKTREE;
      else process.env.SWARMIFYX_IN_WORKTREE = previousSwamifyxInWorktree;
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("respects an explicit CODEX_HOME config override even in worktree mode", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "swamifyx-codex-execute-explicit-"));
    const workspace = path.join(root, "workspace");
    const capturePath = path.join(root, "capture.json");
    const sharedCodexHome = path.join(root, "shared-codex-home");
    const explicitCodexHome = path.join(root, "explicit-codex-home");
    const swarmifyxHome = path.join(root, "swarmifyx-home");
    await fs.mkdir(workspace, { recursive: true });
    await fs.mkdir(sharedCodexHome, { recursive: true });
    await fs.writeFile(path.join(sharedCodexHome, "auth.json"), '{"token":"shared"}\n', "utf8");
    const commandPath = await writeFakeCodexCommand(root, "codex");

    const previousHome = process.env.HOME;
    const previousSwamifyxHome = process.env.SWARMIFYX_HOME;
    const previousSwamifyxInstanceId = process.env.SWARMIFYX_INSTANCE_ID;
    const previousSwamifyxInWorktree = process.env.SWARMIFYX_IN_WORKTREE;
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.HOME = root;
    process.env.SWARMIFYX_HOME = swarmifyxHome;
    process.env.SWARMIFYX_INSTANCE_ID = "worktree-1";
    process.env.SWARMIFYX_IN_WORKTREE = "true";
    process.env.CODEX_HOME = sharedCodexHome;

    try {
      const result = await execute({
        runId: "run-2",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Codex Coder",
          adapterType: "codex_local",
          adapterConfig: {},
        },
        runtime: {
          sessionId: null,
          sessionParams: null,
          sessionDisplayId: null,
          taskKey: null,
        },
        config: {
          command: commandPath,
          cwd: workspace,
          env: {
            SWARMIFYX_TEST_CAPTURE_PATH: capturePath,
            CODEX_HOME: explicitCodexHome,
          },
          promptTemplate: "Follow the swarmifyx heartbeat.",
        },
        context: {},
        authToken: "run-jwt-token",
        onLog: async () => { },
      });

      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toBeNull();

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.codexHome).toBe(explicitCodexHome);
      await expect(fs.lstat(path.join(swarmifyxHome, "instances", "worktree-1", "codex-home"))).rejects.toThrow();
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
      if (previousSwamifyxHome === undefined) delete process.env.SWARMIFYX_HOME;
      else process.env.SWARMIFYX_HOME = previousSwamifyxHome;
      if (previousSwamifyxInstanceId === undefined) delete process.env.SWARMIFYX_INSTANCE_ID;
      else process.env.SWARMIFYX_INSTANCE_ID = previousSwamifyxInstanceId;
      if (previousSwamifyxInWorktree === undefined) delete process.env.SWARMIFYX_IN_WORKTREE;
      else process.env.SWARMIFYX_IN_WORKTREE = previousSwamifyxInWorktree;
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
