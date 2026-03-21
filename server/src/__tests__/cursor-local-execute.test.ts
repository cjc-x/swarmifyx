import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execute } from "@abacus-lab/adapter-cursor-local/server";

async function writeFakeCursorCommand(basePath: string): Promise<string> {
  const script = `
const fs = require("node:fs");

const capturePath = process.env.ABACUS_TEST_CAPTURE_PATH;
const payload = {
  argv: process.argv.slice(2),
  prompt: fs.readFileSync(0, "utf8"),
  abacusEnvKeys: Object.keys(process.env)
    .filter((key) => key.startsWith("ABACUS_"))
    .sort(),
};
if (capturePath) {
  fs.writeFileSync(capturePath, JSON.stringify(payload), "utf8");
}
console.log(JSON.stringify({
  type: "system",
  subtype: "init",
  session_id: "cursor-session-1",
  model: "auto",
}));
console.log(JSON.stringify({
  type: "assistant",
  message: { content: [{ type: "output_text", text: "hello" }] },
}));
console.log(JSON.stringify({
  type: "result",
  subtype: "success",
  session_id: "cursor-session-1",
  result: "ok",
}));
`;
  if (process.platform === "win32") {
    const scriptPath = `${basePath}.js`;
    const commandPath = `${basePath}.cmd`;
    await fs.writeFile(scriptPath, script, "utf8");
    await fs.writeFile(
      commandPath,
      `@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`,
      "utf8",
    );
    return commandPath;
  }

  await fs.writeFile(basePath, `#!/usr/bin/env node\n${script}`, "utf8");
  await fs.chmod(basePath, 0o755);
  return basePath;
}

type CapturePayload = {
  argv: string[];
  prompt: string;
  abacusEnvKeys: string[];
};

describe("cursor execute", () => {
  it("injects abacus env vars and prompt note by default", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "abacus-cursor-execute-"));
    const workspace = path.join(root, "workspace");
    const commandPath = await writeFakeCursorCommand(path.join(root, "agent"));
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });

    const previousHome = process.env.HOME;
    process.env.HOME = root;

    let invocationPrompt = "";
    try {
      const result = await execute({
        runId: "run-1",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Cursor Coder",
          adapterType: "cursor",
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
          model: "auto",
          env: {
            ABACUS_TEST_CAPTURE_PATH: capturePath,
          },
          promptTemplate: "Follow the abacus heartbeat.",
        },
        context: {},
        authToken: "run-jwt-token",
        onLog: async () => { },
        onMeta: async (meta) => {
          invocationPrompt = meta.prompt ?? "";
        },
      });

      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toBeNull();

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.argv).not.toContain("Follow the abacus heartbeat.");
      expect(capture.argv).not.toContain("--mode");
      expect(capture.argv).not.toContain("ask");
      expect(capture.abacusEnvKeys).toEqual(
        expect.arrayContaining([
          "ABACUS_AGENT_ID",
          "ABACUS_API_KEY",
          "ABACUS_API_URL",
          "ABACUS_COMPANY_ID",
          "ABACUS_RUN_ID",
        ]),
      );
      expect(capture.prompt).toContain("Abacus runtime note:");
      expect(capture.prompt).toContain("ABACUS_API_KEY");
      expect(invocationPrompt).toContain("Abacus runtime note:");
      expect(invocationPrompt).toContain("ABACUS_API_URL");
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = previousHome;
      }
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("passes --mode when explicitly configured", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "abacus-cursor-execute-mode-"));
    const workspace = path.join(root, "workspace");
    const commandPath = await writeFakeCursorCommand(path.join(root, "agent"));
    const capturePath = path.join(root, "capture.json");
    await fs.mkdir(workspace, { recursive: true });

    const previousHome = process.env.HOME;
    process.env.HOME = root;

    try {
      const result = await execute({
        runId: "run-2",
        agent: {
          id: "agent-1",
          companyId: "company-1",
          name: "Cursor Coder",
          adapterType: "cursor",
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
          model: "auto",
          mode: "ask",
          env: {
            ABACUS_TEST_CAPTURE_PATH: capturePath,
          },
          promptTemplate: "Follow the abacus heartbeat.",
        },
        context: {},
        authToken: "run-jwt-token",
        onLog: async () => { },
      });

      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toBeNull();

      const capture = JSON.parse(await fs.readFile(capturePath, "utf8")) as CapturePayload;
      expect(capture.argv).toContain("--mode");
      expect(capture.argv).toContain("ask");
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = previousHome;
      }
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
