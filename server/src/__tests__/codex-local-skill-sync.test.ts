import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@abacus-lab/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const abacusKey = "abacus-lab/abacus/abacus";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Abacus skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("abacus-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        abacusSkillSync: {
          desiredSkills: [abacusKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(abacusKey);
    expect(before.entries.find((entry) => entry.key === abacusKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === abacusKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === abacusKey)?.detail).toContain(".agents/skills");
  });

  it("does not persist Abacus skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("abacus-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        abacusSkillSync: {
          desiredSkills: [abacusKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [abacusKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === abacusKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "abacus"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled Abacus skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("abacus-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        abacusSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(abacusKey);
    expect(after.entries.find((entry) => entry.key === abacusKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Abacus skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("abacus-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        abacusSkillSync: {
          desiredSkills: ["abacus"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(abacusKey);
    expect(snapshot.desiredSkills).not.toContain("abacus");
    expect(snapshot.entries.find((entry) => entry.key === abacusKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "abacus")).toBeUndefined();
  });
});
