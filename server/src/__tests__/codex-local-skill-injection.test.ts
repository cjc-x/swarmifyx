import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@chopsticks/adapter-codex-local/server";

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

async function createChopsticksRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"chopsticks"}\n', "utf8");
  await fs.writeFile(
    path.join(root, "skills", skillName, "SKILL.md"),
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
    const codexHome = await makeTempDir("chopsticks-codex-home-");
    cleanupDirs.add(codexHome);

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    const logs: string[] = [];
    try {
      await ensureCodexSkillsInjected(async (_stream, chunk) => {
        logs.push(chunk);
      });

      const injectedSkill = path.join(codexHome, "skills", "chopsticks");
      const runtimeSkill = path.resolve(__dirname, "../../../skills", "chopsticks");

      expect(await fs.realpath(injectedSkill)).toBe(await fs.realpath(runtimeSkill));
      expect(logs.some((line) => line.includes('Injected Codex skill "chopsticks"'))).toBe(true);
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });

  it("repairs a Codex Chopsticks skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("chopsticks-codex-current-");
    const oldRepo = await makeTempDir("chopsticks-codex-old-");
    const skillsHome = await makeTempDir("chopsticks-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createChopsticksRepoSkill(currentRepo, "chopsticks");
    await createChopsticksRepoSkill(oldRepo, "chopsticks");
    await fs.symlink(path.join(oldRepo, "skills", "chopsticks"), path.join(skillsHome, "chopsticks"));

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [{ name: "chopsticks", source: path.join(currentRepo, "skills", "chopsticks") }],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "chopsticks"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "chopsticks")),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Repaired Codex skill "chopsticks"'),
      }),
    );
  });

  it("preserves a custom Codex skill symlink outside Chopsticks repo checkouts", async () => {
    const customRoot = await makeTempDir("chopsticks-codex-custom-");
    const codexHome = await makeTempDir("chopsticks-codex-home-");
    cleanupDirs.add(customRoot);
    cleanupDirs.add(codexHome);

    await createCustomSkill(customRoot, "chopsticks");
    await fs.mkdir(path.join(codexHome, "skills"), { recursive: true });
    await fs.symlink(path.join(customRoot, "custom", "chopsticks"), path.join(codexHome, "skills", "chopsticks"));

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      await ensureCodexSkillsInjected(async () => { });

      expect(await fs.realpath(path.join(codexHome, "skills", "chopsticks"))).toBe(
        await fs.realpath(path.join(customRoot, "custom", "chopsticks")),
      );
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });
});
