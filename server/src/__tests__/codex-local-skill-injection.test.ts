import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@abacus-lab/adapter-codex-local/server";

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

async function createAbacusRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"abacus"}\n', "utf8");
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
    const codexHome = await makeTempDir("abacus-codex-home-");
    cleanupDirs.add(codexHome);

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    const logs: string[] = [];
    try {
      await ensureCodexSkillsInjected(async (_stream, chunk) => {
        logs.push(chunk);
      });

      const injectedSkill = path.join(codexHome, "skills", "abacus");
      const runtimeSkill = path.resolve(__dirname, "../../../skills", "abacus");

      expect(await fs.realpath(injectedSkill)).toBe(await fs.realpath(runtimeSkill));
      expect(logs.some((line) => line.includes('Injected Codex skill "abacus"'))).toBe(true);
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });

  it("repairs a Codex Abacus skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("abacus-codex-current-");
    const oldRepo = await makeTempDir("abacus-codex-old-");
    const skillsHome = await makeTempDir("abacus-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createAbacusRepoSkill(currentRepo, "abacus");
    await createAbacusRepoSkill(oldRepo, "abacus");
    await fs.symlink(path.join(oldRepo, "skills", "abacus"), path.join(skillsHome, "abacus"));

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [{ name: "abacus", source: path.join(currentRepo, "skills", "abacus") }],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "abacus"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "abacus")),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Repaired Codex skill "abacus"'),
      }),
    );
  });

  it("preserves a custom Codex skill symlink outside Abacus repo checkouts", async () => {
    const customRoot = await makeTempDir("abacus-codex-custom-");
    const codexHome = await makeTempDir("abacus-codex-home-");
    cleanupDirs.add(customRoot);
    cleanupDirs.add(codexHome);

    await createCustomSkill(customRoot, "abacus");
    await fs.mkdir(path.join(codexHome, "skills"), { recursive: true });
    await fs.symlink(path.join(customRoot, "custom", "abacus"), path.join(codexHome, "skills", "abacus"));

    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      await ensureCodexSkillsInjected(async () => { });

      expect(await fs.realpath(path.join(codexHome, "skills", "abacus"))).toBe(
        await fs.realpath(path.join(customRoot, "custom", "abacus")),
      );
    } finally {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
    }
  });
});
