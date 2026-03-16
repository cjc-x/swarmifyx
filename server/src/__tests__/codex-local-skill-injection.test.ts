import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@papertape/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createCustomSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "custom", skillName), { recursive: true });
  await fs.writeFile(
    path.join(root, "custom", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

describe("codex local adapter skill injection", () => {
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("injects missing Codex skills from the runtime skills directory", async () => {
    const codexHome = await makeTempDir("papertape-codex-home-");
    cleanupDirs.add(codexHome);

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    const logs: string[] = [];
    try {
      await ensureCodexSkillsInjected(async (_stream, chunk) => {
        logs.push(chunk);
      });

      const injectedSkill = path.join(codexHome, "skills", "papertape");
      const runtimeSkill = path.resolve(__dirname, "../../../skills", "papertape");

      expect(await fs.realpath(injectedSkill)).toBe(await fs.realpath(runtimeSkill));
      expect(logs.some((line) => line.includes('Injected Codex skill "papertape"'))).toBe(true);
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });

  it("preserves a custom Codex skill symlink outside Papertape repo checkouts", async () => {
    const customRoot = await makeTempDir("papertape-codex-custom-");
    const codexHome = await makeTempDir("papertape-codex-home-");
    cleanupDirs.add(customRoot);
    cleanupDirs.add(codexHome);

    await createCustomSkill(customRoot, "papertape");
    await fs.mkdir(path.join(codexHome, "skills"), { recursive: true });
    await fs.symlink(path.join(customRoot, "custom", "papertape"), path.join(codexHome, "skills", "papertape"));

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      await ensureCodexSkillsInjected(async () => { });

      expect(await fs.realpath(path.join(codexHome, "skills", "papertape"))).toBe(
        await fs.realpath(path.join(customRoot, "custom", "papertape")),
      );
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });
});
