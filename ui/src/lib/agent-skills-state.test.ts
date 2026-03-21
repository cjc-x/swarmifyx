import { describe, expect, it } from "vitest";
import { applyAgentSkillSnapshot, isReadOnlyUnmanagedSkillEntry } from "./agent-skills-state";

describe("applyAgentSkillSnapshot", () => {
  it("hydrates the initial snapshot without arming autosave", () => {
    const result = applyAgentSkillSnapshot(
      {
        draft: [],
        lastSaved: [],
        hasHydratedSnapshot: false,
      },
      ["abacus", "para-memory-files"],
    );

    expect(result).toEqual({
      draft: ["abacus", "para-memory-files"],
      lastSaved: ["abacus", "para-memory-files"],
      hasHydratedSnapshot: true,
      shouldSkipAutosave: true,
    });
  });

  it("keeps unsaved local edits when a fresh snapshot arrives", () => {
    const result = applyAgentSkillSnapshot(
      {
        draft: ["abacus", "custom-skill"],
        lastSaved: ["abacus"],
        hasHydratedSnapshot: true,
      },
      ["abacus"],
    );

    expect(result).toEqual({
      draft: ["abacus", "custom-skill"],
      lastSaved: ["abacus"],
      hasHydratedSnapshot: true,
      shouldSkipAutosave: false,
    });
  });

  it("adopts server state after a successful save and skips the follow-up autosave pass", () => {
    const result = applyAgentSkillSnapshot(
      {
        draft: ["abacus", "custom-skill"],
        lastSaved: ["abacus", "custom-skill"],
        hasHydratedSnapshot: true,
      },
      ["abacus", "custom-skill"],
    );

    expect(result).toEqual({
      draft: ["abacus", "custom-skill"],
      lastSaved: ["abacus", "custom-skill"],
      hasHydratedSnapshot: true,
      shouldSkipAutosave: true,
    });
  });

  it("treats user-installed entries outside the company library as read-only unmanaged skills", () => {
    expect(isReadOnlyUnmanagedSkillEntry({
      key: "crack-python",
      runtimeName: "crack-python",
      desired: false,
      managed: false,
      state: "external",
      origin: "user_installed",
    }, new Set(["abacus"]))).toBe(true);
  });

  it("keeps company-library entries in the managed section even when the adapter reports an external conflict", () => {
    expect(isReadOnlyUnmanagedSkillEntry({
      key: "abacus",
      runtimeName: "abacus",
      desired: true,
      managed: false,
      state: "external",
      origin: "company_managed",
    }, new Set(["abacus"]))).toBe(false);
  });

  it("falls back to legacy snapshots that only mark unmanaged external entries", () => {
    expect(isReadOnlyUnmanagedSkillEntry({
      key: "legacy-external",
      runtimeName: "legacy-external",
      desired: false,
      managed: false,
      state: "external",
    }, new Set())).toBe(true);
  });
});
