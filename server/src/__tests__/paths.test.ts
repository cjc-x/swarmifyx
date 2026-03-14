import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSwarmifyxConfigPath } from "../paths.ts";

const ORIGINAL_CWD = process.cwd();
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resolveSwarmifyxConfigPath", () => {
  it("prefers repo-local .swarmifyx config files", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "swarmifyx-server-paths-"));
    const projectDir = path.join(tempDir, "repo");
    fs.mkdirSync(path.join(projectDir, ".swarmifyx"), { recursive: true });
    fs.writeFileSync(path.join(projectDir, ".swarmifyx", "config.json"), "{}\n");
    delete process.env.SWARMIFYX_CONFIG;
    process.chdir(projectDir);

    expect(resolveSwarmifyxConfigPath()).toBe(path.join(projectDir, ".swarmifyx", "config.json"));
  });
});
