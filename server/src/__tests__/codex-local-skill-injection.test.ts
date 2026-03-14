import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@swamifyx/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createSwamifyxRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"swarmifyx"}\n', "utf8");
  await fs.writeFile(
    path.join(root, "skills", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

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

  it("repairs a Codex Swamifyx skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("swamifyx-codex-current-");
    const oldRepo = await makeTempDir("swamifyx-codex-old-");
    const skillsHome = await makeTempDir("swamifyx-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createSwamifyxRepoSkill(currentRepo, "swarmifyx");
    await createSwamifyxRepoSkill(oldRepo, "swarmifyx");
    await fs.symlink(path.join(oldRepo, "skills", "swarmifyx"), path.join(skillsHome, "swarmifyx"));

    const logs: string[] = [];
    await ensureCodexSkillsInjected(
      async (_stream, chunk) => {
        logs.push(chunk);
      },
      {
        skillsHome,
        skillsEntries: [{ name: "swarmifyx", source: path.join(currentRepo, "skills", "swarmifyx") }],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "swarmifyx"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "swarmifyx")),
    );
    expect(logs.some((line) => line.includes('Repaired Codex skill "swarmifyx"'))).toBe(true);
  });

  it("preserves a custom Codex skill symlink outside Swamifyx repo checkouts", async () => {
    const currentRepo = await makeTempDir("swamifyx-codex-current-");
    const customRoot = await makeTempDir("swamifyx-codex-custom-");
    const skillsHome = await makeTempDir("swamifyx-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(customRoot);
    cleanupDirs.add(skillsHome);

    await createSwamifyxRepoSkill(currentRepo, "swarmifyx");
    await createCustomSkill(customRoot, "swarmifyx");
    await fs.symlink(path.join(customRoot, "custom", "swarmifyx"), path.join(skillsHome, "swarmifyx"));

    await ensureCodexSkillsInjected(async () => { }, {
      skillsHome,
      skillsEntries: [{ name: "swarmifyx", source: path.join(currentRepo, "skills", "swarmifyx") }],
    });

    expect(await fs.realpath(path.join(skillsHome, "swarmifyx"))).toBe(
      await fs.realpath(path.join(customRoot, "custom", "swarmifyx")),
    );
  });
});
